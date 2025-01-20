import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { parse } from 'path';
import { Mode } from 'src/app/model/mode';
import { Quiz } from 'src/app/model/quiz';
import { LoginService } from 'src/app/services/auth.service';
import { RestService } from 'src/app/services/rest.service';
import { SignalRService } from 'src/app/services/signalr.service';

@Component({
  selector: 'app-quiz-quizmaker',
  templateUrl: './quiz-quizmaker.component.html'
})
export class QuizQuizmakerComponent {
  quizTitle: string = '';
  description: string = '';
  quiz: Quiz | undefined;
  @Input() quizId: string = "";
  @Output() saveQuiz = new EventEmitter<void>();

  @Input()
  set newQuiz(value: Quiz | undefined) {
    this.quiz = value;
   
    if (value) {
      this.quizTitle = value.title || '';
      this.description = value.description || '';
    }
  }
  constructor(
    private restService: RestService,
    private router: Router,
    private route: ActivatedRoute,
    private signalRService: SignalRService,
    private loginService: LoginService
  ) {
  }

  ngOnChanges() {
    if (this.quiz?.id){
      this.saveQuiz.emit();
    }
  }
  autosaveQuiz(){
    this.saveQuiz.emit();
  }

  onImageUploaded(imageName: string): void {
    if (this.quiz) {
      this.quiz.imageName = imageName;
    }
  }
  
  updateQuizTitle(title: string) {
    if (this.quiz) {
      this.quiz.title = title;
    }
  }

  updateQuizDescription(desc: string) {
    if (this.quiz) {
      this.quiz.description = desc;
    }
  }

  getImageFromServer(imageUrl: string) {
    if (this.quiz) {
      this.quiz.imageName = this.restService.getImage(imageUrl);
    }
  }

  onImageDelete(){
    if (this.quiz) {
      this.quiz.imageName = '';
    }
  }

  async onClose(){
    if (confirm("Are you sure you want to leave? All unsaved changes will be lost.")) {
      if (this.quiz?.id){
        this.saveQuiz.emit();
      }
      if (this.quizId) {
        await this.router.navigate(['/dashboard'], {queryParams: {quizId: this.quizId}});
      } else {
        await this.router.navigate(['/dashboard'])
      }
    }
  }

  handleFileInput(event: any) {
    const files = event?.target?.files;
    if (files && files.length > 0) {
      const file = files.item(0);
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageString = e.target?.result as string;

          const extension = file.name.split('.').pop();
          const fileName = `quizImage.${extension}`;

          this.uploadImage(imageString, fileName).subscribe(data => {
            this.getImageFromServer(data);
          });
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select an image file.')
      }
    } else {
      alert('Please select an image file.')
    }
  }

  uploadImage(imageString: string, fileName: string) {
    const imageBlob = this.dataURItoBlob(imageString);

    const formData = new FormData();

    formData.append('image', imageBlob, fileName);

    return this.restService.addImage(formData);
  }

  dataURItoBlob(dataURI: string) {
    const byteString = window.atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([int8Array], { type: 'image/jpeg' });
    return blob;
  }

  playDemoMode() {
    if (this.quiz?.id) {
    const id = parseInt(this.quiz.id.toString());
    this.saveQuiz.emit();
    this.restService.getNewGameId(id).subscribe(data => {
      this.router.navigate(['/question'], { queryParams: { gameId: data , mode: Mode.TEACHER_DEMO_MODE, quizId: this.quiz?.id } });
    });
  } else {
    alert('Please save the quiz first.');
  }
  }
}

