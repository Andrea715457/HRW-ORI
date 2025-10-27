// snies.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SniesService {
  // ajusta si tu backend no cuelga de la misma base
  private base = 'http://127.0.0.1:8888/api/snies';

  constructor(private http: HttpClient) {}

  downloadByName(name: string): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/download`, {
      params: { name, t: Date.now().toString() }, // anti-cache
      observe: 'response',
      responseType: 'blob',
    });
  }
}
