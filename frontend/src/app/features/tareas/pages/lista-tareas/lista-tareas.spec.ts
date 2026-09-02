import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaTareas } from './lista-tareas';

describe('ListaTareas', () => {
  let component: ListaTareas;
  let fixture: ComponentFixture<ListaTareas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaTareas],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaTareas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
