import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
    expect(screen.getByText('How does your skin usually feel throughout the day?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Balanced / Normal'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 1: Goals
    expect(screen.getByText('What would you like your skincare routine to help with?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2: Reactivity & Experience
    expect(screen.getByText('How does your skin usually react to skincare products?')).toBeInTheDocument();
    expect(
      screen.getByText("Choose the option that feels closest to your experience. This isn't a diagnosis.")
    ).toBeInTheDocument();
    expect(screen.getByText('Rarely reacts')).toBeInTheDocument();
    expect(screen.getByText('Sometimes reacts')).toBeInTheDocument();
    expect(screen.getByText('Reacts easily')).toBeInTheDocument();
    expect(
      screen.getByText('How familiar are you with skincare ingredients like retinol and exfoliating acids?')
    ).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Some experience')).toBeInTheDocument();
    expect(screen.getByText('Experienced')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3: Exclusions
    expect(screen.getByText('Are there any ingredients you prefer to avoid?')).toBeInTheDocument();
    expect(
      screen.getByText("Select ingredients you already know you want to avoid. We'll exclude them from your suggested routine where possible.")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 4: Profile Confirmation
    expect(screen.getByText('Review your skin parameters')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /generate my ritual/i }));

    // Step 5: Personal Ritual Ready (Celebration & Google Sign-In)
    expect(screen.getByText('Your Personal Skin Ritual is Ready')).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google to unlock your routine/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('renders updated skin feel question, user-friendly options, and modal explanation helper', () => {
    render(
      <BrowserRouter>
        <Quiz />
      </BrowserRouter>
    );

    // Question and supporting text
    expect(screen.getByText('How does your skin usually feel throughout the day?')).toBeInTheDocument();
    expect(
      screen.getByText('Think about how your skin feels a few hours after washing it, before applying skincare.')
    ).toBeInTheDocument();

    // 4 User-friendly explanations
    expect(
      screen.getByText('My skin generally feels comfortable, without excessive oiliness or dryness.')
    ).toBeInTheDocument();
    expect(screen.getByText('My skin often feels tight, rough, or flaky.')).toBeInTheDocument();
    expect(
      screen.getByText('My face tends to look shiny or feel greasy throughout the day.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('My forehead and nose get oily, while my cheeks stay normal or dry.')
    ).toBeInTheDocument();

    // Helper link
    const helperLink = screen.getByRole('button', {
      name: /Not sure\? Learn how to identify your skin type/i,
    });
    expect(helperLink).toBeInTheDocument();

    // Modal is initially not visible
    expect(screen.queryByText('Identifying Your Skin Type')).not.toBeInTheDocument();

    // Click helper link opens modal without leaving the quiz
    fireEvent.click(helperLink);
    expect(screen.getByText('Identifying Your Skin Type')).toBeInTheDocument();
    expect(screen.getByText('The Bare-Face Observation Test (30–60 Minutes)')).toBeInTheDocument();
    expect(screen.getByText(/Dehydration is a condition, not a type/i)).toBeInTheDocument();
    expect(screen.getByText(/Skin type is not a medical diagnosis/i)).toBeInTheDocument();
    expect(screen.getByText(/changes over time/i)).toBeInTheDocument();

    // Close modal via "Back to Quiz"
    const backBtn = screen.getByRole('button', { name: /Back to Quiz/i });
    fireEvent.click(backBtn);
    expect(screen.queryByText('Identifying Your Skin Type')).not.toBeInTheDocument();

    // Quiz is still on Step 0, intact
    expect(screen.getByText('How does your skin usually feel throughout the day?')).toBeInTheDocument();
  });

  it('renders updated skincare goals question, live counter, options, and 3-concern limit notice', () => {
    render(
      <BrowserRouter>
        <Quiz />
      </BrowserRouter>
    );

    // Proceed past Step 0
    fireEvent.click(screen.getByText('Balanced / Normal'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 1: Goals
    expect(
      screen.getByText('What would you like your skincare routine to help with?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Choose up to 3 concerns. Pick the ones that matter most to you.')
    ).toBeInTheDocument();

    // Initial counter is 0/3
    expect(screen.getByText('Choose up to 3 concerns · 0/3 selected')).toBeInTheDocument();

    // Check all 8 option labels and user-friendly explanations
    expect(screen.getByText('Breakouts & clogged pores')).toBeInTheDocument();
    expect(screen.getByText('Pimples, blackheads, or frequent breakouts.')).toBeInTheDocument();

    expect(screen.getByText('Skin barrier support')).toBeInTheDocument();
    expect(screen.getByText('Skin that feels irritated, tight, or easily uncomfortable.')).toBeInTheDocument();

    expect(screen.getByText('Dark spots & uneven tone')).toBeInTheDocument();
    expect(screen.getByText('Post-breakout marks or uneven pigmentation.')).toBeInTheDocument();

    expect(screen.getByText('Fine lines & skin firmness')).toBeInTheDocument();
    expect(screen.getByText('Early visible lines or changes in skin firmness.')).toBeInTheDocument();

    expect(screen.getByText('Rough or uneven texture')).toBeInTheDocument();
    expect(screen.getByText('Skin that feels bumpy or uneven.')).toBeInTheDocument();

    expect(screen.getByText('Redness & sensitivity')).toBeInTheDocument();
    expect(screen.getByText('Skin that frequently looks flushed or feels irritated.')).toBeInTheDocument();

    expect(screen.getByText('Dullness & radiance')).toBeInTheDocument();
    expect(screen.getByText('Skin that looks tired or lacks radiance.')).toBeInTheDocument();

    expect(screen.getByText('Dehydrated skin')).toBeInTheDocument();
    expect(screen.getByText('Skin that feels tight or lacks moisture, even if oily.')).toBeInTheDocument();

    // Select 1 concern
    fireEvent.click(screen.getByText('Breakouts & clogged pores'));
    expect(screen.getByText('Choose up to 3 concerns · 1/3 selected')).toBeInTheDocument();

    // Select 2 concerns
    fireEvent.click(screen.getByText('Skin barrier support'));
    expect(screen.getByText('Choose up to 3 concerns · 2/3 selected')).toBeInTheDocument();

    // Select 3rd concern
    fireEvent.click(screen.getByText('Dehydrated skin'));
    expect(screen.getByText('Choose up to 3 concerns · 3/3 selected')).toBeInTheDocument();

    // Attempting to select a 4th concern does not add it
    fireEvent.click(screen.getByText('Dullness & radiance'));
    expect(screen.getByText('Choose up to 3 concerns · 3/3 selected')).toBeInTheDocument();

    // Deselect one
    fireEvent.click(screen.getByText('Breakouts & clogged pores'));
    expect(screen.getByText('Choose up to 3 concerns · 2/3 selected')).toBeInTheDocument();
  });

  it('renders separated reactivity and ingredient experience questions with 3-tier pacing', () => {
    render(
      <BrowserRouter>
        <Quiz />
      </BrowserRouter>
    );

    // Proceed past Step 0 & 1
    fireEvent.click(screen.getByText('Balanced / Normal'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Question A
    expect(screen.getByText('How does your skin usually react to skincare products?')).toBeInTheDocument();
    expect(
      screen.getByText("Choose the option that feels closest to your experience. This isn't a diagnosis.")
    ).toBeInTheDocument();
    expect(screen.getByText('Rarely reacts')).toBeInTheDocument();
    expect(screen.getByText('Most products feel comfortable on my skin.')).toBeInTheDocument();
    expect(screen.getByText('Sometimes reacts')).toBeInTheDocument();
    expect(screen.getByText('Certain products cause irritation or redness.')).toBeInTheDocument();
    expect(screen.getByText('Reacts easily')).toBeInTheDocument();
    expect(screen.getByText('My skin frequently feels irritated or uncomfortable.')).toBeInTheDocument();

    // Question B
    expect(
      screen.getByText('How familiar are you with skincare ingredients like retinol and exfoliating acids?')
    ).toBeInTheDocument();
    expect(screen.getByText("I've never used them or have very little experience.")).toBeInTheDocument();
    expect(screen.getByText('Some experience')).toBeInTheDocument();
    expect(screen.getByText("I've used them occasionally.")).toBeInTheDocument();
    expect(screen.getByText('Experienced')).toBeInTheDocument();
    expect(screen.getByText('I use them regularly and generally tolerate them.')).toBeInTheDocument();

    // Select "Reacts easily"
    fireEvent.click(screen.getByText('Reacts easily'));
    // Select "Some experience"
    fireEvent.click(screen.getByText('Some experience'));

    fireEvent.click(screen.getByRole('button', { name: /continue/i })); // to exclusions
    fireEvent.click(screen.getByRole('button', { name: /continue/i })); // to confirmation

    // Verify Confirmation review card shows updated reactivity and experience
    expect(screen.getByText('Reactivity & Experience')).toBeInTheDocument();
    expect(screen.getByText('Reacts Easily')).toBeInTheDocument();
    expect(screen.getByText(/Ultra-gentle active pacing prioritizing barrier protection/i)).toBeInTheDocument();
  });

  it('renders updated ingredients exclusion question, concise descriptions, and expandable explanations distinguishing preference from allergy', () => {
    render(
      <BrowserRouter>
        <Quiz />
      </BrowserRouter>
    );

    // Proceed past Step 0, 1, 2
    fireEvent.click(screen.getByText('Balanced / Normal'));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 3 Heading & Supporting Text
    expect(screen.getByText('Are there any ingredients you prefer to avoid?')).toBeInTheDocument();
    expect(
      screen.getByText("Select ingredients you already know you want to avoid. We'll exclude them from your suggested routine where possible.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Exclusion is based on your preference and does not replace clinical allergy diagnosis/i)
    ).toBeInTheDocument();

    // Verify concise neutral descriptions
    expect(
      screen.getByText('A vitamin A ingredient commonly used in skincare for acne and visible signs of aging.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('An exfoliating ingredient commonly used for clogged pores and acne-prone skin.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('A soothing ingredient derived from finely ground oats, commonly used to calm dry or irritated skin.')
    ).toBeInTheDocument();

    // Verify "Learn more" buttons exist
    const learnMoreButtons = screen.getAllByRole('button', { name: /learn more/i });
    expect(learnMoreButtons.length).toBe(6);

    // Click "Learn more" on Retinol
    const retinolCard = screen.getByText('Retinol').closest('.rounded-2xl') as HTMLElement;
    const retinolLearnMore = within(retinolCard).getByRole('button', { name: /learn more/i });
    fireEvent.click(retinolLearnMore);
    expect(screen.getByText(/Already using prescription retinoids, experiencing peeling\/dryness/i)).toBeInTheDocument();
    expect(screen.getByText(/Exclude if pregnant or nursing without clinician approval/i)).toBeInTheDocument();

    // Click "Learn more" on Colloidal Oatmeal
    const oatCard = screen.getByText('Colloidal Oatmeal').closest('.rounded-2xl') as HTMLElement;
    const oatLearnMore = within(oatCard).getByRole('button', { name: /learn more/i });
    fireEvent.click(oatLearnMore);
    expect(screen.getByText(/diagnosed oat allergy/i)).toBeInTheDocument();

    // Select Retinol to exclude it
    fireEvent.click(screen.getByText('Retinol'));

    // Move to Step 4: Profile Confirmation
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Confirmation shows Retinol excluded
    expect(screen.getByText('1 Excluded')).toBeInTheDocument();
    expect(screen.getByText('Retinol')).toBeInTheDocument();
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
