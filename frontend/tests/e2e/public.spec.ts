import { test, expect } from '@playwright/test';

test.describe('Tour 1: Public Pages', () => {
  test('should load onboarding page if no tenant is selected', async ({ page }) => {
    await page.goto('/');
    
    // It should redirect to /onboarding or load it directly
    await expect(page).toHaveURL(/.*onboarding|.*login/);

    // If redirected to login without tenant, it might bounce to onboarding
    await page.goto('/onboarding');
    
    // Check if the glassmorphism box and welcome text exist
    await expect(page.locator('text=Bem-vindo ao Sigma')).toBeVisible();
    await expect(page.locator('text=Qual a sua Potência?')).toBeVisible();
    
    // Verify the premium UI elements are present (e.g. the animated box or logos)
    await expect(page.locator('img[alt="Sigma Logo"]')).toBeVisible();
  });

  test('should load login page properly', async ({ page }) => {
    await page.goto('/login');
    
    // As it redirects to onboarding if no tenant, we simulate having a tenant
    await page.evaluate(() => {
      localStorage.setItem('tenant_potencia', 'admin');
    });
    
    await page.goto('/login');
    
    // Verify the restrito access text
    await expect(page.locator('text=Acesso Restrito')).toBeVisible();
    
    // Verify inputs
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Verify login button
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible();
  });
});
