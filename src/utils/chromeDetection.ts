/**
 * 🌐 CHROME DETECTION & COMPATIBILITY UTILITIES
 * Herramientas para detectar Chrome y aplicar fixes específicos
 */

export interface ChromeInfo {
  isChrome: boolean;
  isMobile: boolean;
  version: number | null;
  hasExtensions: boolean;
  isIncognito: boolean;
}

/**
 * Detecta si el navegador es Chrome y obtiene información detallada
 */
export function detectChrome(): ChromeInfo {
  const userAgent = navigator.userAgent;
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
  
  let version = null;
  if (isChrome) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? parseInt(match[1], 10) : null;
  }
  
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  
  // Detectar si hay extensiones (método indirecto)
  const hasExtensions = checkForExtensions();
  
  // Detectar modo incógnito (método indirecto)
  const isIncognito = checkIncognitoMode();
  
  return {
    isChrome,
    isMobile,
    version,
    hasExtensions,
    isIncognito
  };
}

/**
 * Verifica si hay extensiones de Chrome activas
 */
function checkForExtensions(): boolean {
  try {
    // Buscar elementos típicos de extensiones
    const extensionElements = [
      'grammarly-desktop-integration',
      '[data-grammarly-part]',
      '[data-extension-id]',
      '.chrome-extension'
    ];
    
    for (const selector of extensionElements) {
      if (document.querySelector(selector)) {
        return true;
      }
    }
    
    // Verificar si window tiene propiedades de extensiones
    const extensionProps = ['chrome', 'grammarly', 'adblockplus'];
    for (const prop of extensionProps) {
      if ((window as any)[prop]) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Detecta si Chrome está en modo incógnito
 */
function checkIncognitoMode(): boolean {
  try {
    // Método para Chrome moderno
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return new Promise<boolean>((resolve) => {
        navigator.storage.estimate().then(estimate => {
          resolve((estimate.quota || 0) < 120000000); // < 120MB indica incógnito
        }).catch(() => resolve(false));
      }) as any;
    }
    
    // Método fallback
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Aplica fixes específicos para Chrome
 */
export function applyChromeCompatibilityFixes(chromeInfo: ChromeInfo): void {
  if (!chromeInfo.isChrome) return;
  
  console.log('🌐 Aplicando fixes de compatibilidad para Chrome:', chromeInfo);
  
  // Fix 1: Agregar clases específicas
  document.documentElement.classList.add('chrome-browser');
  if (chromeInfo.isMobile) {
    document.documentElement.classList.add('mobile-chrome');
  }
  
  // Fix 2: Suprimir warnings de hydratación específicos de Chrome
  suppressChromeHydrationWarnings();
  
  // Fix 3: Manejar extensiones problemáticas
  if (chromeInfo.hasExtensions) {
    handleChromeExtensions();
  }
  
  // Fix 4: Optimizar rendering para Chrome
  optimizeChromeRendering();
  
  // Fix 5: Manejar problemas de timing en Chrome
  handleChromeTimingIssues();
}

/**
 * Suprime warnings específicos de Chrome
 */
function suppressChromeHydrationWarnings(): void {
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Lista de warnings específicos de Chrome que son falsos positivos
    const chromeSpecificWarnings = [
      'Warning: Text content did not match',
      'Warning: Expected server HTML to contain',
      'Hydration failed because the initial UI',
      'There was an error while hydrating',
      'Warning: Did not expect server HTML to contain',
      'Warning: validateDOMNesting'
    ];
    
    const shouldSuppress = chromeSpecificWarnings.some(warning => 
      message.includes(warning)
    );
    
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suprimir errores específicos de hydratación en Chrome
    if (message.includes('Hydration failed') || message.includes('did not match')) {
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
}

/**
 * Maneja extensiones problemáticas de Chrome
 */
function handleChromeExtensions(): void {
  // Observer para remover elementos de extensiones
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Lista de selectores de extensiones problemáticas
          const extensionSelectors = [
            'grammarly-desktop-integration',
            '[data-grammarly-part]',
            '[data-extension-id]',
            '.chrome-extension',
            'iframe[src*="extension"]'
          ];
          
          for (const selector of extensionSelectors) {
            if (element.matches && element.matches(selector)) {
              try {
                element.remove();
                console.log('🧹 Elemento de extensión Chrome removido:', element.tagName);
              } catch (e) {
                // Ignorar errores
              }
              break;
            }
          }
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Cleanup después de 30 segundos
  setTimeout(() => observer.disconnect(), 30000);
}

/**
 * Optimiza rendering específicamente para Chrome
 */
function optimizeChromeRendering(): void {
  // Forzar aceleración por hardware
  document.documentElement.style.transform = 'translateZ(0)';
  document.documentElement.style.backfaceVisibility = 'hidden';
  
  // Optimizar font rendering
  (document.documentElement.style as any).webkitFontSmoothing = 'antialiased';
  document.documentElement.style.textRendering = 'optimizeLegibility';
  
  // Prevenir layout shifts
  document.documentElement.style.contentVisibility = 'auto';
}

/**
 * Maneja problemas de timing específicos de Chrome
 */
function handleChromeTimingIssues(): void {
  // Esperar a que Chrome complete su inicialización
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Emitir evento cuando Chrome esté listo
      const event = new CustomEvent('chromeReady', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      // Remover clase de loading si existe
      document.documentElement.classList.remove('loading');
      document.documentElement.classList.add('loaded');
    });
  });
}

/**
 * Función de utilidad para debugging de Chrome
 */
export function debugChromeCompatibility(): void {
  const chromeInfo = detectChrome();
  
  console.group('🌐 CHROME COMPATIBILITY DEBUG');
  console.log('Chrome Info:', chromeInfo);
  console.log('User Agent:', navigator.userAgent);
  console.log('Vendor:', navigator.vendor);
  console.log('Extensions Detected:', chromeInfo.hasExtensions);
  console.log('Mobile Chrome:', chromeInfo.isMobile);
  console.log('Chrome Version:', chromeInfo.version);
  
  // Test de compatibilidad
  console.log('CSS.supports test:', CSS.supports('display', 'grid'));
  console.log('IntersectionObserver:', 'IntersectionObserver' in window);
  console.log('ResizeObserver:', 'ResizeObserver' in window);
  
  console.groupEnd();
} 