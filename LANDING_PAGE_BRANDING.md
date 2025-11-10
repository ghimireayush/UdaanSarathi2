# Landing Page Branding Update

## Status: Partially Complete

### ✅ Completed:

1. **Footer Branding**
   - Added Udaan Sarathi logo to footer
   - Updated all brand colors to official palette:
     - Primary Blue: `#006BA3`
     - Dark Blue: `#003E76`
     - Primary Green: `#56AF12`
     - Light Green: `#6EC31C`
   - Social media icons hover to brand colors
   - Contact info icons use brand colors

2. **Logo Integration**
   - Logo imported from `src/assets/logo.svg`
   - Logo displays in footer with brand name

### ⏳ Remaining Tasks:

1. **Navbar Logo** (PublicLandingPage.jsx)
   - Add logo next to "Udaan Sarathi" text
   - Update text color to brand blue: `#006BA3`
   - Update Login button to brand colors

2. **Hero Section Colors**
   - Update gradient background to use brand colors
   - Update CTA buttons to brand colors

3. **Stats Section**
   - Update icon colors to brand palette

4. **Features Section**
   - Update feature card colors to brand palette
   - Update CTA section gradient

5. **How It Works Section**
   - Update step colors to brand palette

## Brand Color Palette:

```css
/* Primary Colors */
--brand-blue-primary: #006BA3;
--brand-blue-dark: #003E76;
--brand-green-primary: #56AF12;
--brand-green-light: #6EC31C;

/* Usage */
Light Mode: Use blue (#006BA3)
Dark Mode: Use green (#56AF12)
Hover States: Use darker variants
```

## Implementation Guide:

### Replace Generic Blue with Brand Blue:
```jsx
// Before
className="bg-blue-600 hover:bg-blue-700"

// After
className="bg-[#006BA3] hover:bg-[#003E76]"
```

### Dark Mode with Brand Green:
```jsx
// Before
className="dark:bg-blue-500 dark:hover:bg-blue-600"

// After
className="dark:bg-[#56AF12] dark:hover:bg-[#6EC31C]"
```

### Icon Colors:
```jsx
// Before
className="text-blue-500 dark:text-blue-400"

// After
className="text-[#006BA3] dark:text-[#56AF12]"
```

## Files Updated:
- ✅ src/components/public/Footer.jsx
- ⏳ src/pages/PublicLandingPage.jsx (needs logo in navbar)
- ⏳ src/components/public/HeroSection.jsx (needs brand colors)
- ⏳ src/components/public/StatsSection.jsx (needs brand colors)
- ⏳ src/components/public/Features.jsx (needs brand colors)
- ⏳ src/components/public/HowItWorks.jsx (needs brand colors)

## Next Steps:

1. Update PublicLandingPage navbar with logo and brand colors
2. Update all blue colors throughout components to brand blue
3. Update all green accents to brand green
4. Test in both light and dark modes
5. Ensure consistent branding across all sections
