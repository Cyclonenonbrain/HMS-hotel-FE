import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'vnd',
  standalone: true
})
export class VndPipe implements PipeTransform {
  transform(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return '0₫';
    }

    return numValue.toLocaleString('vi-VN') + '₫';
  }
}
