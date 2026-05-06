import { Component, HostBinding, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-admin-scrollbar',
  standalone: true,
  imports: [],
  template: `
    <div class="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar-wrapper">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './admin-scrollbar.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminScrollbarComponent {
  @HostBinding('class') class = 'block h-full w-full overflow-hidden relative';
}
