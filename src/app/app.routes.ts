import { Routes } from '@angular/router';
import {
  authGuard,
  onboardingGuard,
  guestGuard,
} from './core/guards/auth.guard';
import { AuthComponent } from './features/auth/auth.component';
import { OnboardingComponent } from './features/onboarding/onboarding.component';
import { MainLayoutComponent } from './main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TransactionsComponent } from './features/transactions/transactions.component';
import { DebtsLoansComponent } from './features/debts-loans/debts-loans.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'onboarding',
    component: OnboardingComponent,
    canActivate: [onboardingGuard],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'transactions',
        component: TransactionsComponent,
      },
      {
        path: 'debts-loans',
        component: DebtsLoansComponent,
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
