# Actualización a Next.js 15+

Este documento detalla el proceso de actualización del proyecto de Next.js 14 a Next.js 15+.

## Cambios realizados

### 1. Dependencias actualizadas

- Next.js: actualizado a la versión 15.4.1
- React y React DOM: actualizados a la versión 18.3+
- Tailwind CSS: se mantuvo en la versión 3.4.1 (ver [TAILWIND_V4_ISSUES.md](./TAILWIND_V4_ISSUES.md) para más información)
- Plugin de Netlify para Next.js: actualizado a la última versión

### 2. Configuración actualizada

- **next.config.js**: 
  - Reemplazado `domains` por `remotePatterns` en la configuración de imágenes
  - Eliminada la opción `swcMinify` que ya no es reconocida en Next.js 15
  - Simplificada la configuración de webpack para mejor compatibilidad

- **postcss.config.js**:
  - Mantenida la configuración estándar para Tailwind CSS v3

- **globals.css**:
  - Mantenida la sintaxis estándar de Tailwind CSS v3

### 3. Compatibilidad con Tailwind CSS

Se intentó actualizar a Tailwind CSS v4, pero debido a problemas de compatibilidad y cambios estructurales importantes, se decidió mantener Tailwind CSS v3.4.1. Para más detalles, consulta el archivo [TAILWIND_V4_ISSUES.md](./TAILWIND_V4_ISSUES.md).

## Posibles problemas y soluciones

### Problemas con las rutas de API

Si encuentras errores relacionados con las rutas de API, asegúrate de que los archivos de ruta estén utilizando la sintaxis correcta para Next.js 15:

```typescript
// Sintaxis correcta para Next.js 15
export async function GET(
  request: Request,
  context: { params: { key: string } }
) {
  const { params } = context;
  // ...
}
```

### Problemas con la configuración de Next.js

Si encuentras errores relacionados con la configuración de Next.js, consulta la [documentación oficial de migración](https://nextjs.org/docs/app/building-your-application/upgrading) para obtener más información.

## Pruebas realizadas

- Verificación de la compilación y ejecución del proyecto
- Comprobación de la correcta aplicación de estilos de Tailwind
- Verificación de la compatibilidad con Netlify

## Próximos pasos

- Revisar y actualizar cualquier componente que pueda estar utilizando APIs obsoletas
- Optimizar el rendimiento aprovechando las nuevas características de Next.js 15
- Actualizar la documentación del proyecto