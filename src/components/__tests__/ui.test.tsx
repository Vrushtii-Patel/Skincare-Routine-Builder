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
    expect(screen.getByText('Explore with Sample Shelf')).toBeInTheDocument();
    expect(screen.getByText(/skincare ritual/i)).toBeInTheDocument();
  });
});
