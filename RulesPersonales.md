\# REGLAS PARA PROYECTOS WEB CON NEXT.JS, TYPESCRIPT Y TAILWIND CSS



\### MISIÓN: Construir aplicaciones web ultra-rápidas, mantenibles, accesibles y optimizadas para SEO. El rendimiento no es una opción, es el requisito principal.



---



\## I. PRINCIPIOS FUNDAMENTALES (La Filosofía)



1\. \*\*Rendimiento Primero (Performance First):\*\* Cada decisión debe priorizar la velocidad de carga y la interactividad. Objetivo: Core Web Vitals verdes y Lighthouse 95+ en Performance.



2\. \*\*Server-Side por Defecto:\*\* Usa Server Components como base. Client Components solo cuando sea estrictamente necesario para interactividad. Marca explícitamente con `'use client'`.



3\. \*\*Todo es un Componente:\*\* La interfaz se construye con componentes React pequeños, reutilizables y con una única responsabilidad.



4\. \*\*Seguridad de Tipos Total:\*\* TypeScript estricto obligatorio. Prohibido `any`, `unknown` solo cuando sea necesario. Todo tipado: props, APIs, estado, y datos.



5\. \*\*CSS Nativo Primero:\*\* Si algo se puede hacer con CSS puro, NO uses JavaScript. Animaciones, transiciones, layouts responsive, hover effects - todo con CSS.



6\. \*\*Utility-First CSS:\*\* Tailwind CSS directo en JSX. `@apply` solo para patrones muy repetitivos en `globals.css`.



---



\## II. ESTRUCTURA DEL PROYECTO (La Arquitectura)



```

src/

├── app/                    // App Router de Next.js 13+

│   ├── (routes)/          // Grupos de rutas

│   ├── api/               // API Routes

│   ├── globals.css        // Estilos globales + Tailwind

│   ├── layout.tsx         // Layout raíz

│   ├── loading.tsx        // UI de carga global

│   ├── not-found.tsx      // Página 404

│   └── page.tsx           // Página principal

├── components/            // Componentes React reutilizables

│   ├── ui/               // Componentes básicos (Button, Card, Input)

│   ├── sections/         // Secciones completas (Hero, Footer, Navbar)

│   ├── forms/            // Componentes de formularios

│   └── providers/        // Context providers

├── lib/                  // Utilidades y configuraciones

│   ├── utils.ts          // Funciones helper (cn, formatters, etc.)

│   ├── validations.ts    // Esquemas Zod para validación

│   ├── constants.ts      // Constantes globales

│   └── db.ts            // Configuración de base de datos

├── hooks/               // Custom hooks

├── types/               // Definiciones de tipos TypeScript

├── styles/              // Estilos adicionales si es necesario

└── public/              // Archivos estáticos

&nbsp;   ├── images/          // Imágenes optimizadas

&nbsp;   ├── icons/           // Iconos SVG

&nbsp;   └── fonts/           // Fuentes locales

```



---



\## III. COMPONENTES REACT



\### 1. Server Components por Defecto

```tsx

// ✅ BIEN: Server Component (por defecto)

interface ProductListProps {

&nbsp; category: string;

}



export default async function ProductList({ category }: ProductListProps) {

&nbsp; const products = await getProducts(category); // Fetch en servidor

&nbsp; 

&nbsp; return (

&nbsp;   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

&nbsp;     {products.map((product) => (

&nbsp;       <ProductCard key={product.id} product={product} />

&nbsp;     ))}

&nbsp;   </div>

&nbsp; );

}

```



\### 2. Client Components Solo Cuando Sea Necesario

```tsx

// ✅ Client Component para interactividad

'use client'



import { useState } from 'react';



interface CounterProps {

&nbsp; initialValue?: number;

}



export default function Counter({ initialValue = 0 }: CounterProps) {

&nbsp; const \[count, setCount] = useState(initialValue);

&nbsp; 

&nbsp; return (

&nbsp;   <div className="flex items-center gap-4">

&nbsp;     <button 

&nbsp;       onClick={() => setCount(c => c - 1)}

&nbsp;       className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"

&nbsp;     >

&nbsp;       -

&nbsp;     </button>

&nbsp;     <span className="text-2xl font-bold">{count}</span>

&nbsp;     <button 

&nbsp;       onClick={() => setCount(c => c + 1)}

&nbsp;       className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"

&nbsp;     >

&nbsp;       +

&nbsp;     </button>

&nbsp;   </div>

&nbsp; );

}

```



\### 3. Tipado Estricto de Props

```tsx

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {

&nbsp; variant?: 'primary' | 'secondary' | 'outline';

&nbsp; size?: 'sm' | 'md' | 'lg';

&nbsp; isLoading?: boolean;

&nbsp; children: React.ReactNode;

}



export function Button({ 

&nbsp; variant = 'primary', 

&nbsp; size = 'md', 

&nbsp; isLoading = false,

&nbsp; className,

&nbsp; children,

&nbsp; disabled,

&nbsp; ...props 

}: ButtonProps) {

&nbsp; return (

&nbsp;   <button

&nbsp;     className={cn(

&nbsp;       'font-medium rounded focus:ring-2 focus:ring-offset-2 transition-colors',

&nbsp;       {

&nbsp;         'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',

&nbsp;         'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500': variant === 'secondary',

&nbsp;         'border border-gray-300 bg-white hover:bg-gray-50 focus:ring-blue-500': variant === 'outline',

&nbsp;       },

&nbsp;       {

&nbsp;         'px-3 py-1.5 text-sm': size === 'sm',

&nbsp;         'px-4 py-2': size === 'md',

&nbsp;         'px-6 py-3 text-lg': size === 'lg',

&nbsp;       },

&nbsp;       className

&nbsp;     )}

&nbsp;     disabled={disabled || isLoading}

&nbsp;     {...props}

&nbsp;   >

&nbsp;     {isLoading ? 'Cargando...' : children}

&nbsp;   </button>

&nbsp; );

}

```



---



\## IV. CSS NATIVO PRIMERO - PROHIBIDO JS PARA DISEÑO



\### ❌ NUNCA hagas esto con JavaScript:

```tsx

// ❌ MAL: Animación con JavaScript

const \[isVisible, setIsVisible] = useState(false);



useEffect(() => {

&nbsp; const timer = setTimeout(() => setIsVisible(true), 100);

&nbsp; return () => clearTimeout(timer);

}, \[]);



return (

&nbsp; <div style={{ 

&nbsp;   opacity: isVisible ? 1 : 0,

&nbsp;   transform: `translateY(${isVisible ? 0 : 20}px)`,

&nbsp;   transition: 'all 0.3s ease'

&nbsp; }}>

&nbsp;   Contenido

&nbsp; </div>

);

```



\### ✅ HAZ esto con CSS:

```tsx

// ✅ BIEN: Animación con CSS puro

return (

&nbsp; <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

&nbsp;   Contenido

&nbsp; </div>

);

```



\### Tailwind CSS Personalizado para Animaciones

```css

/\* globals.css \*/

@tailwind base;

@tailwind components;

@tailwind utilities;



@layer utilities {

&nbsp; .animate-in {

&nbsp;   animation-fill-mode: both;

&nbsp; }

&nbsp; 

&nbsp; .fade-in {

&nbsp;   animation: fade-in 0.3s ease-out;

&nbsp; }

&nbsp; 

&nbsp; .slide-in-from-bottom-4 {

&nbsp;   animation: slide-in-from-bottom-4 0.3s ease-out;

&nbsp; }

}



@keyframes fade-in {

&nbsp; from { opacity: 0; }

&nbsp; to { opacity: 1; }

}



@keyframes slide-in-from-bottom-4 {

&nbsp; from { 

&nbsp;   opacity: 0;

&nbsp;   transform: translateY(1rem);

&nbsp; }

&nbsp; to { 

&nbsp;   opacity: 1;

&nbsp;   transform: translateY(0);

&nbsp; }

}

```



---



\## V. TAILWIND CSS



\### 1. Clases Estáticas SIEMPRE

```tsx

// ❌ MAL: Clases dinámicas

const color = 'red';

<div className={`text-${color}-500`}>Texto</div>



// ✅ BIEN: Clases completas

const getColorClass = (color: string) => {

&nbsp; const colors = {

&nbsp;   red: 'text-red-500',

&nbsp;   blue: 'text-blue-500',

&nbsp;   green: 'text-green-500',

&nbsp; } as const;

&nbsp; return colors\[color as keyof typeof colors] || 'text-gray-500';

};

```



\### 2. Utility Function para Classes

```tsx

// lib/utils.ts

import { type ClassValue, clsx } from 'clsx';

import { twMerge } from 'tailwind-merge';



export function cn(...inputs: ClassValue\[]) {

&nbsp; return twMerge(clsx(inputs));

}

```



\### 3. Configuración Tailwind Optimizada

```js

// tailwind.config.js

/\*\* @type {import('tailwindcss').Config} \*/

module.exports = {

&nbsp; content: \[

&nbsp;   './src/pages/\*\*/\*.{js,ts,jsx,tsx,mdx}',

&nbsp;   './src/components/\*\*/\*.{js,ts,jsx,tsx,mdx}',

&nbsp;   './src/app/\*\*/\*.{js,ts,jsx,tsx,mdx}',

&nbsp; ],

&nbsp; theme: {

&nbsp;   extend: {

&nbsp;     animation: {

&nbsp;       'fade-in': 'fade-in 0.3s ease-out',

&nbsp;       'slide-in': 'slide-in 0.3s ease-out',

&nbsp;     },

&nbsp;     keyframes: {

&nbsp;       'fade-in': {

&nbsp;         from: { opacity: '0' },

&nbsp;         to: { opacity: '1' },

&nbsp;       },

&nbsp;       'slide-in': {

&nbsp;         from: { opacity: '0', transform: 'translateY(1rem)' },

&nbsp;         to: { opacity: '1', transform: 'translateY(0)' },

&nbsp;       },

&nbsp;     },

&nbsp;   },

&nbsp; },

&nbsp; plugins: \[],

};

```



---



\## VI. RENDIMIENTO EN NEXT.JS



\### 1. Optimización de Imágenes

```tsx

import Image from 'next/image';



// ✅ BIEN: Componente Image optimizado

export function OptimizedImage({ src, alt, ...props }) {

&nbsp; return (

&nbsp;   <Image 

&nbsp;     src={src}

&nbsp;     alt={alt}

&nbsp;     width={800}

&nbsp;     height={600}

&nbsp;     placeholder="blur"

&nbsp;     blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."

&nbsp;     className="rounded-lg"

&nbsp;     {...props}

&nbsp;   />

&nbsp; );

}

```



\### 2. Dynamic Imports para Code Splitting

```tsx

import dynamic from 'next/dynamic';



// ✅ Carga perezosa de componentes pesados

const HeavyChart = dynamic(() => import('./HeavyChart'), {

&nbsp; loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded" />,

&nbsp; ssr: false, // Solo si es necesario

});

```



\### 3. Suspense para Loading States

```tsx

import { Suspense } from 'react';



export default function Page() {

&nbsp; return (

&nbsp;   <div>

&nbsp;     <h1>Mi Página</h1>

&nbsp;     <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded" />}>

&nbsp;       <AsyncComponent />

&nbsp;     </Suspense>

&nbsp;   </div>

&nbsp; );

}

```



---



\## VII. ACCESIBILIDAD (A11Y)



\### 1. HTML Semántico

```tsx

// ✅ BIEN: Estructura semántica

export default function ArticlePage() {

&nbsp; return (

&nbsp;   <main className="max-w-4xl mx-auto px-4 py-8">

&nbsp;     <article>

&nbsp;       <header>

&nbsp;         <h1 className="text-3xl font-bold mb-4">Título del Artículo</h1>

&nbsp;         <time dateTime="2024-01-15" className="text-gray-600">

&nbsp;           15 de enero, 2024

&nbsp;         </time>

&nbsp;       </header>

&nbsp;       <section className="prose prose-lg">

&nbsp;         <p>Contenido del artículo...</p>

&nbsp;       </section>

&nbsp;     </article>

&nbsp;   </main>

&nbsp; );

}

```



\### 2. Focus Management

```tsx

'use client'



import { useRef, useEffect } from 'react';



export function Modal({ isOpen, onClose, children }) {

&nbsp; const focusRef = useRef<HTMLButtonElement>(null);

&nbsp; 

&nbsp; useEffect(() => {

&nbsp;   if (isOpen \&\& focusRef.current) {

&nbsp;     focusRef.current.focus();

&nbsp;   }

&nbsp; }, \[isOpen]);

&nbsp; 

&nbsp; if (!isOpen) return null;

&nbsp; 

&nbsp; return (

&nbsp;   <div 

&nbsp;     className="fixed inset-0 bg-black/50 flex items-center justify-center"

&nbsp;     onClick={onClose}

&nbsp;     role="dialog"

&nbsp;     aria-modal="true"

&nbsp;   >

&nbsp;     <div 

&nbsp;       className="bg-white rounded-lg p-6 max-w-md w-full mx-4"

&nbsp;       onClick={(e) => e.stopPropagation()}

&nbsp;     >

&nbsp;       <button

&nbsp;         ref={focusRef}

&nbsp;         onClick={onClose}

&nbsp;         className="sr-only"

&nbsp;         aria-label="Cerrar modal"

&nbsp;       >

&nbsp;         Cerrar

&nbsp;       </button>

&nbsp;       {children}

&nbsp;     </div>

&nbsp;   </div>

&nbsp; );

}

```



---



\## VIII. SEO Y METADATA



\### 1. Metadata API de Next.js 13+

```tsx

// app/page.tsx

import type { Metadata } from 'next';



export const metadata: Metadata = {

&nbsp; title: 'Título de la Página',

&nbsp; description: 'Descripción SEO optimizada',

&nbsp; openGraph: {

&nbsp;   title: 'Título para redes sociales',

&nbsp;   description: 'Descripción para redes sociales',

&nbsp;   images: \['/og-image.jpg'],

&nbsp; },

&nbsp; twitter: {

&nbsp;   card: 'summary\_large\_image',

&nbsp; },

};



export default function Page() {

&nbsp; return <div>Contenido</div>;

}

```



\### 2. Structured Data

```tsx

export default function ProductPage({ product }) {

&nbsp; const jsonLd = {

&nbsp;   '@context': 'https://schema.org',

&nbsp;   '@type': 'Product',

&nbsp;   name: product.name,

&nbsp;   description: product.description,

&nbsp;   image: product.image,

&nbsp;   offers: {

&nbsp;     '@type': 'Offer',

&nbsp;     price: product.price,

&nbsp;     priceCurrency: 'USD',

&nbsp;   },

&nbsp; };

&nbsp; 

&nbsp; return (

&nbsp;   <>

&nbsp;     <script

&nbsp;       type="application/ld+json"

&nbsp;       dangerouslySetInnerHTML={{ \_\_html: JSON.stringify(jsonLd) }}

&nbsp;     />

&nbsp;     <div>Contenido del producto</div>

&nbsp;   </>

&nbsp; );

}

```



---



\## IX. VALIDACIÓN Y TIPOS



\### 1. Zod para Validación

```tsx

// lib/validations.ts

import { z } from 'zod';



export const userFormSchema = z.object({

&nbsp; name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),

&nbsp; email: z.string().email('Email inválido'),

&nbsp; age: z.number().min(18, 'Debe ser mayor de edad'),

});



export type UserFormData = z.infer<typeof userFormSchema>;

```



\### 2. Server Actions con Validación

```tsx

// app/actions.ts

'use server'



import { userFormSchema } from '@/lib/validations';

import { redirect } from 'next/navigation';



export async function createUser(formData: FormData) {

&nbsp; const validatedFields = userFormSchema.safeParse({

&nbsp;   name: formData.get('name'),

&nbsp;   email: formData.get('email'),

&nbsp;   age: Number(formData.get('age')),

&nbsp; });

&nbsp; 

&nbsp; if (!validatedFields.success) {

&nbsp;   return {

&nbsp;     errors: validatedFields.error.flatten().fieldErrors,

&nbsp;   };

&nbsp; }

&nbsp; 

&nbsp; // Lógica para crear usuario

&nbsp; // ...

&nbsp; 

&nbsp; redirect('/success');

}

```



---



\## X. HERRAMIENTAS Y CONFIGURACIÓN



\### 1. TypeScript Estricto

```json

// tsconfig.json

{

&nbsp; "compilerOptions": {

&nbsp;   "strict": true,

&nbsp;   "noUncheckedIndexedAccess": true,

&nbsp;   "noImplicitReturns": true,

&nbsp;   "noFallthroughCasesInSwitch": true,

&nbsp;   "exactOptionalPropertyTypes": true

&nbsp; }

}

```



\### 2. ESLint y Prettier

```json

// .eslintrc.json

{

&nbsp; "extends": \[

&nbsp;   "next/core-web-vitals",

&nbsp;   "@typescript-eslint/recommended"

&nbsp; ],

&nbsp; "rules": {

&nbsp;   "@typescript-eslint/no-unused-vars": "error",

&nbsp;   "@typescript-eslint/no-explicit-any": "error"

&nbsp; }

}

```



\### 3. Scripts de Package.json

```json

{

&nbsp; "scripts": {

&nbsp;   "dev": "next dev",

&nbsp;   "build": "next build",

&nbsp;   "start": "next start",

&nbsp;   "lint": "next lint",

&nbsp;   "lint:fix": "next lint --fix",

&nbsp;   "type-check": "tsc --noEmit",

&nbsp;   "format": "prettier --write .",

&nbsp;   "analyze": "cross-env ANALYZE=true next build"

&nbsp; }

}

```



---



\## XI. REGLAS DE ORO



1\. \*\*CSS PRIMERO:\*\* Si se puede hacer con CSS, NO uses JavaScript.

2\. \*\*Server Components por Defecto:\*\* Solo usa `'use client'` cuando necesites interactividad.

3\. \*\*Tipado Estricto:\*\* Prohibido `any`. Todo debe estar tipado.

4\. \*\*Performance Crítico:\*\* Cada decisión debe considerar el impacto en rendimiento.

5\. \*\*Accesibilidad No Opcional:\*\* HTML semántico y navegación por teclado siempre.

6\. \*\*SEO Built-in:\*\* Metadata y structured data en cada página.

7\. \*\*Componentes Pequeños:\*\* Una responsabilidad por componente.

8\. \*\*Validación Robusta:\*\* Zod para schemas y validación de datos.



---



\*\*RECUERDA:\*\* El objetivo es crear aplicaciones web que sean increíblemente rápidas, accesibles, mantenibles y que brinden una experiencia de usuario excepcional. Cada línea de código debe contribuir a estos objetivos.

