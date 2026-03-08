import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  rooms = [
    {
      title: 'Grand Suite',
      price: 800,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1974',
      desc: 'Experience ultimate comfort in our Grand Suite, featuring panoramic ocean views and bespoke furnishings.',
      beds: '1 King',
      view: 'Ocean',
      guests: 2
    },
    {
      title: 'Royal Villa',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070',
      desc: 'A private oasis with its own infinity pool, dedicated butler service, and expansive living areas.',
      beds: '2 King',
      view: 'Pool',
      guests: 4
    },
    {
      title: 'Ocean Penthouse',
      price: 2200,
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1974',
      desc: 'The pinnacle of luxury. Occupying the top floor with 360-degree views and unmatched elegance.',
      beds: '3 King',
      view: '360°',
      guests: 6
    }
  ];

  features = [
    { icon: 'restaurant', title: 'Fine Dining', desc: 'Michelin-starred chefs preparing exquisite culinary masterpieces.' },
    { icon: 'spa', title: 'World-Class Spa', desc: 'Rejuvenate your body and mind in our award-winning wellness center.' },
    { icon: 'concierge', title: '24/7 Concierge', desc: 'Dedicated staff ready to fulfill your every request, any time.' },
    { icon: 'verified_user', title: 'Ultimate Privacy', desc: 'Exclusive access and secluded areas ensuring your peace of mind.' }
  ];
}