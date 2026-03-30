import { Component, ElementRef, inject, output, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditService } from '../../core/services/audit.service';

const SCROLL_THRESHOLD_PX = 80;

@Component({
  selector: 'app-audit-panel',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './audit-panel.html',
})
export class AuditPanel {
  protected readonly audit = inject(AuditService);
  readonly close = output<void>();

  protected readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    void this.audit.loadFirst();
  }

  onScroll(): void {
    const el = this.scroller().nativeElement;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < SCROLL_THRESHOLD_PX) {
      void this.audit.loadMore();
    }
  }
}
