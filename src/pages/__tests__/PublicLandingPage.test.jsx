import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import PublicLandingPage from '../PublicLandingPage'

// Mock the translation hook
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key) => key, // Return the key as translation for testing
    currentLanguage: 'en',
    switchLanguage: jest.fn()
  })
}))

// Mock child components
jest.mock('../../components/public/Navbar', () => {
  return function MockNavbar() {
    return <nav data-testid="navbar">Navbar</nav>
  }
})

jest.mock('../../components/public/HeroSection', () => {
  return function MockHeroSection() {
    return <section data-testid="hero-section">Hero Section</section>
  }
})

jest.mock('../../components/public/StatsSection', () => {
  return function MockStatsSection() {
    return <section data-testid="stats-section">Stats Section</section>
  }
})

jest.mock('../../components/public/HowItWorks', () => {
  return function MockHowItWorks() {
    return <section data-testid="how-it-works">How It Works</section>
  }
})

jest.mock('../../components/public/AgencySearch', () => {
  return function MockAgencySearch() {
    return <section data-testid="agency-search">Agency Search</section>
  }
})

jest.mock('../../components/public/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>
  }
})

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('PublicLandingPage', () => {
  test('renders all main sections', () => {
    renderWithRouter(<PublicLandingPage />)
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('stats-section')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument()
    expect(screen.getByTestId('agency-search')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  test('has correct page structure', () => {
    renderWithRouter(<PublicLandingPage />)
    
    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveClass('min-h-screen')
  })

  test('renders without crashing', () => {
    expect(() => {
      renderWithRouter(<PublicLandingPage />)
    }).not.toThrow()
  })
})