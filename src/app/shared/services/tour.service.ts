import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { driver } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class TourService {
  private platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'sima_has_seen_tour';

  start() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (localStorage.getItem(this.STORAGE_KEY)) return;

    const driverInstance = driver({
      showProgress: true,
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      steps: [
        {
          element: '#tour-home',
          popover: { title: 'Início', description: 'Acesse sua página principal e Dashboard de cursos por aqui.' }
        },
        {
          element: '#tour-saved',
          popover: { title: 'Aulas Salvas', description: 'Encontre rapidamente as aulas que você marcou para revisar depois.' }
        },
        {
          element: '#tour-courses',
          popover: { title: 'Minhas Inscrições', description: 'Veja todos os cursos e trilhas em que você está matriculado.' }
        },
        {
          element: '#tour-profile',
          popover: { title: 'Seu Perfil', description: 'Edite suas informações, troque a foto e ajuste preferências.' }
        },
      ],
      onDestroyed: () => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem(this.STORAGE_KEY, 'true');
        }
      }
    });

    driverInstance.drive();
  }
}
