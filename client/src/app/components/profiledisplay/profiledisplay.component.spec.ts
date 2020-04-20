import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfiledisplayComponent } from './profiledisplay.component';

describe('ProfiledisplayComponent', () => {
  let component: ProfiledisplayComponent;
  let fixture: ComponentFixture<ProfiledisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProfiledisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfiledisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
