import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({ selector: '[appHasRole]' })
export class HasRoleDirective {
  private vcr = inject(ViewContainerRef);
  private tpl = inject(TemplateRef<any>);
  private auth = inject(AuthService);

  @Input('appHasRole') set roles(rs: string[]) {
    const ok = this.auth.hasAnyRole(rs);
    this.vcr.clear();
    if (ok) this.vcr.createEmbeddedView(this.tpl);
  }
}
