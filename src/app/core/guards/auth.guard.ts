import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { FamilyService } from '../services/family.service';

async function waitForAuthInit(supabase: SupabaseService): Promise<void> {
  if (supabase.authInitialized()) return;
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (supabase.authInitialized()) {
        clearInterval(check);
        resolve();
      }
    }, 30);
  });
}

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const familyService = inject(FamilyService);
  const router = inject(Router);

  await waitForAuthInit(supabase);
  if (!supabase.currentUser()) {
    return router.createUrlTree(['/auth']);
  }

  if (!familyService.checkedMembership()) {
    await familyService.loadCurrentFamily();
  }

  if (!familyService.hasFamily()) {
    return router.createUrlTree(['/onboarding']);
  }

  return true;
};

export const onboardingGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const familyService = inject(FamilyService);
  const router = inject(Router);

  await waitForAuthInit(supabase);
  if (!supabase.currentUser()) {
    return router.createUrlTree(['/auth']);
  }

  if (!familyService.checkedMembership()) {
    await familyService.loadCurrentFamily();
  }

  if (familyService.hasFamily()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};

export const guestGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const familyService = inject(FamilyService);
  const router = inject(Router);

  await waitForAuthInit(supabase);
  if (!supabase.currentUser()) {
    return true;
  }

  if (!familyService.checkedMembership()) {
    await familyService.loadCurrentFamily();
  }

  return familyService.hasFamily()
    ? router.createUrlTree(['/dashboard'])
    : router.createUrlTree(['/onboarding']);
};
