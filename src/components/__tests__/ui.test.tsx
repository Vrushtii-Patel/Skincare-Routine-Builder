import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BottleIllustration } from '../skincare/SkincareIllustrations';
import { Modal } from '../ui/Modal';
import {
  AppDisclaimerFooter,
  RetinoidPregnancyAdvisory,
  SunscreenGuidanceNotice,
} from '../safety/SafetyNotices';
import { Welcome } from '../../pages/Welcome';
import { Quiz } from '../../pages/Quiz';
import { Today } from '../../pages/Today';
import { Navbar } from '../layout/Navbar';
import { useStore } from '../../store/useStore';

describe('UI Components & Accessibility', () => {
  it('renders custom SVG bottle illustrations in each shape', () => {
    const { container: dropper } = render(<BottleIllustration shape="dropper" color="#C496A1" />);
    expect(dropper.querySelector('svg')).toBeInTheDocument();

    const { container: tube } = render(<BottleIllustration shape="tube" color="#919D85" />);
    expect(tube.querySelector('svg')).toBeInTheDocument();

    const { container: jar } = render(<BottleIllustration shape="jar" color="#8E88A3" />);
    expect(jar.querySelector('svg')).toBeInTheDocument();

    const { container: pump } = render(<BottleIllustration shape="pump" color="#EBE1C6" />);
    expect(pump.querySelector('svg')).toBeInTheDocument();
  });

  it('renders modal dialog with accessible attributes and close trigger', () => {
    let closed = false;
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => { closed = true; }} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Close dialog');
    fireEvent.click(closeBtn);
    expect(closed).toBe(true);

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders exact safety notice copy verbatim', () => {
    render(<AppDisclaimerFooter />);
    expect(
      screen.getByText(
        'General skincare organiser, not medical advice. It cannot diagnose skin conditions or replace a dermatologist.'
      )
    ).toBeInTheDocument();

    render(<RetinoidPregnancyAdvisory />);
    expect(
      screen.getByText(
        'If you are pregnant or planning a pregnancy, do not use topical retinoids without medical advice. If breastfeeding, ask your clinician whether your specific product is appropriate.'
      )
    ).toBeInTheDocument();

    render(<SunscreenGuidanceNotice />);
    expect(
      screen.getByText(
        'Use broad-spectrum SPF 30+ and water-resistant sunscreen, and reapply about every 2 hours when outdoors. Follow the label.'
      )
    ).toBeInTheDocument();
  });

  it('renders Welcome landing page with call to action', () => {
    render(
      <BrowserRouter>
        <Welcome />
      </BrowserRouter>
    );

    expect(screen.getByText('Start My Skin Journey')).toBeInTheDocument();
    expect(screen.getByText('Personalised skincare starts here.')).toBeInTheDocument();
    expect(screen.getAllByText(/skincare ritual/i).length).toBeGreaterThanOrEqual(1);

    // How It Works 3-step process in navigation & sections
    expect(screen.getAllByText(/How It Works/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tell us about your skin')).toBeInTheDocument();
    expect(screen.getByText('Discover your recommendations')).toBeInTheDocument();
    expect(screen.getByText('Get your daily routine')).toBeInTheDocument();

    // The Science section is rendered
    expect(screen.getByText('The Science Behind Every Ritual')).toBeInTheDocument();

    // Skincare safety disclaimer is rendered near the bottom
    expect(screen.getByText(/Skincare recommendations are provided for informational purposes/i)).toBeInTheDocument();
    expect(screen.getByText(/consult a dermatologist/i)).toBeInTheDocument();

    // Verify removed elements are completely absent
    expect(screen.queryByText(/Explore with Sample Shelf/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Signed in as/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^My Routine$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Sign In$/i })).not.toBeInTheDocument();
  });

  it('renders Quiz and navigates to the Ritual Ready Google Sign-In step', () => {
    render(
      <BrowserRouter>
        <Quiz />
      </BrowserRouter>
    );

    // Step 0: Foundation
    expect(screen.getByText('How would you describe your skin?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Balanced / Normal'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 1: Goals
    expect(screen.getByText('What are your main skincare focuses?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: Tolerability
    expect(screen.getByText('Does your skin lean sensitive?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: Exclusions
    expect(screen.getByText('Are there any ingredients you prefer to avoid?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 4: Profile Confirmation
    expect(screen.getByText('Review your skin parameters')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /generate my ritual/i }));

    // Step 5: Personal Ritual Ready (Celebration & Google Sign-In)
    expect(screen.getByText('Your Personal Skin Ritual is Ready')).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google to unlock your routine/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('does not display streak or skin type when user has not completed onboarding', () => {
    useStore.getState().resetOnboarding();

    const { container: navContainer } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(navContainer.querySelector('.fa-flame, [title*="streak"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/0d streak/i)).not.toBeInTheDocument();

    render(
      <BrowserRouter>
        <Today />
      </BrowserRouter>
    );
    expect(screen.queryByText(/combination skin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/0 Day Streak/i)).not.toBeInTheDocument();
  });
});
