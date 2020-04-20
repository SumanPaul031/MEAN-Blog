import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Binary } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {

  constructor() { }

  public isUserLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public username: BehaviorSubject<String> = new BehaviorSubject<String>('');

  public email: BehaviorSubject<String> = new BehaviorSubject<String>('');

  public Admin: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public Moderator: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public Guest: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public avatarImg: BehaviorSubject<object> = new BehaviorSubject<object>({});

  public users: BehaviorSubject<object> = new BehaviorSubject<object>([]);
}
