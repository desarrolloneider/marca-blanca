import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleTarea } from './detalle-tarea';

describe('DetalleTarea', () => {
  let component: DetalleTarea;
  let fixture: ComponentFixture<DetalleTarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleTarea],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleTarea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
