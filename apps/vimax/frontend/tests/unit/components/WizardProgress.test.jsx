import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WizardProgress from '../../../src/components/WizardProgress';

describe('WizardProgress', () => {
  describe('Step Rendering', () => {
    test('renders all 5 steps with labels', () => {
      render(<WizardProgress currentStep={0} />);
      expect(screen.getByText('Tell Your Idea')).toBeInTheDocument();
      expect(screen.getByText('Your Content')).toBeInTheDocument();
      expect(screen.getByText('Style & Quality')).toBeInTheDocument();
      expect(screen.getByText('Generating')).toBeInTheDocument();
      expect(screen.getByText('Your Video')).toBeInTheDocument();
    });

    test('renders all short labels', () => {
      render(<WizardProgress currentStep={0} />);
      expect(screen.getByText('Idea')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
      expect(screen.getByText('Style')).toBeInTheDocument();
      expect(screen.getByText('Generate')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    test('renders 5 step buttons', () => {
      render(<WizardProgress currentStep={0} />);
      const steps = screen.getAllByRole('button');
      expect(steps).toHaveLength(5);
    });

    test('renders 4 connector lines', () => {
      render(<WizardProgress currentStep={0} />);
      const connectors = document.querySelectorAll('.wizard-connector');
      expect(connectors).toHaveLength(4);
    });
  });

  describe('Active Step', () => {
    test('first step is active when currentStep=0', () => {
      render(<WizardProgress currentStep={0} />);
      const firstStep = screen.getByText('Tell Your Idea').closest('button');
      expect(firstStep).toHaveClass('active');
      expect(firstStep).not.toHaveClass('completed');
    });

    test('second step is active when currentStep=1', () => {
      render(<WizardProgress currentStep={1} />);
      const secondStep = screen.getByText('Your Content').closest('button');
      expect(secondStep).toHaveClass('active');
      expect(secondStep).not.toHaveClass('completed');
    });

    test('last step is active when currentStep=4', () => {
      render(<WizardProgress currentStep={4} />);
      const lastStep = screen.getByText('Your Video').closest('button');
      expect(lastStep).toHaveClass('active');
      expect(lastStep).not.toHaveClass('completed');
    });

    test('active step does not have completed class', () => {
      render(<WizardProgress currentStep={2} />);
      const activeStep = screen.getByText('Style & Quality').closest('button');
      expect(activeStep).toHaveClass('active');
      expect(activeStep).not.toHaveClass('completed');
    });
  });

  describe('Completed Steps', () => {
    test('steps before currentStep are marked completed', () => {
      render(<WizardProgress currentStep={2} />);
      const firstStep = screen.getByText('Tell Your Idea').closest('button');
      const secondStep = screen.getByText('Your Content').closest('button');
      expect(firstStep).toHaveClass('completed');
      expect(secondStep).toHaveClass('completed');
    });

    test('completed steps not marked active', () => {
      render(<WizardProgress currentStep={3} />);
      const firstStep = screen.getByText('Tell Your Idea').closest('button');
      expect(firstStep).toHaveClass('completed');
      expect(firstStep).not.toHaveClass('active');
    });

    test('no steps completed when currentStep=0', () => {
      render(<WizardProgress currentStep={0} />);
      const steps = screen.getAllByRole('button');
      steps.forEach(step => {
        expect(step).not.toHaveClass('completed');
      });
    });

    test('all previous steps completed when currentStep=4', () => {
      render(<WizardProgress currentStep={4} />);
      const firstStep = screen.getByText('Tell Your Idea').closest('button');
      const secondStep = screen.getByText('Your Content').closest('button');
      const thirdStep = screen.getByText('Style & Quality').closest('button');
      const fourthStep = screen.getByText('Generating').closest('button');
      expect(firstStep).toHaveClass('completed');
      expect(secondStep).toHaveClass('completed');
      expect(thirdStep).toHaveClass('completed');
      expect(fourthStep).toHaveClass('completed');
      const lastStep = screen.getByText('Your Video').closest('button');
      expect(lastStep).not.toHaveClass('completed');
    });
  });

  describe('Step Content - Numbers vs Checkmarks', () => {
    test('current step shows number, not checkmark', () => {
      render(<WizardProgress currentStep={1} />);
      const currentStepButton = screen.getByText('Your Content').closest('button');
      const circle = currentStepButton.querySelector('.wizard-step-circle');
      expect(circle.querySelector('svg')).toBeNull();
      expect(circle.querySelector('span')).toHaveTextContent('2');
    });

    test('completed steps show checkmark SVG, not number', () => {
      render(<WizardProgress currentStep={3} />);
      const completedSteps = screen.getAllByRole('button').filter(btn =>
        btn.classList.contains('completed')
      );
      completedSteps.forEach(step => {
        const circle = step.querySelector('.wizard-step-circle');
        expect(circle.querySelector('svg')).toBeInTheDocument();
        expect(circle.querySelector('span')).toBeNull();
      });
    });

    test('future steps show number, not checkmark', () => {
      render(<WizardProgress currentStep={1} />);
      const thirdStep = screen.getByText('Style & Quality').closest('button');
      const circle = thirdStep.querySelector('.wizard-step-circle');
      expect(circle.querySelector('svg')).toBeNull();
      expect(circle.querySelector('span')).toHaveTextContent('3');
    });

    test('checkmark SVG has correct attributes', () => {
      render(<WizardProgress currentStep={2} />);
      const checkmarkSvg = document.querySelector('.wizard-step.completed .wizard-step-circle svg');
      expect(checkmarkSvg).toHaveAttribute('width', '14');
      expect(checkmarkSvg).toHaveAttribute('height', '14');
      expect(checkmarkSvg).toHaveAttribute('viewBox', '0 0 14 14');
      expect(checkmarkSvg.querySelector('path')).toHaveAttribute('d', 'M2.5 7L5.5 10L11.5 4');
    });
  });

  describe('Connector Lines', () => {
    test('connectors exist between all steps', () => {
      render(<WizardProgress currentStep={0} />);
      const connectors = document.querySelectorAll('.wizard-connector');
      expect(connectors).toHaveLength(4);
    });

    test('connector after completed step has completed class', () => {
      render(<WizardProgress currentStep={2} />);
      const connectors = document.querySelectorAll('.wizard-connector');
      // First connector (between step 0 and 1) should be completed
      expect(connectors[0]).toHaveClass('completed');
      // Second connector (between step 1 and 2) should also be completed
      expect(connectors[1]).toHaveClass('completed');
      // Third connector (between step 2 and 3) should NOT be completed
      expect(connectors[2]).not.toHaveClass('completed');
    });

    test('no connectors completed when currentStep=0', () => {
      render(<WizardProgress currentStep={0} />);
      const connectors = document.querySelectorAll('.wizard-connector');
      connectors.forEach(conn => {
        expect(conn).not.toHaveClass('completed');
      });
    });

    test('all connectors completed when currentStep=4', () => {
      render(<WizardProgress currentStep={4} />);
      const connectors = document.querySelectorAll('.wizard-connector');
      connectors.forEach(conn => {
        expect(conn).toHaveClass('completed');
      });
    });
  });

  describe('Click Handling', () => {
    test('completed step calls onStepClick with correct index', () => {
      const handleClick = vi.fn();
      render(<WizardProgress currentStep={2} onStepClick={handleClick} />);
      const firstStep = screen.getByText('Tell Your Idea').closest('button');
      fireEvent.click(firstStep);
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(0);
    });

    test('onStepClick called for any completed step', () => {
      const handleClick = vi.fn();
      render(<WizardProgress currentStep={3} onStepClick={handleClick} />);

      const firstStep = screen.getByText('Tell Your Idea').closest('button');
      fireEvent.click(firstStep);
      expect(handleClick).toHaveBeenCalledWith(0);

      const secondStep = screen.getByText('Your Content').closest('button');
      fireEvent.click(secondStep);
      expect(handleClick).toHaveBeenCalledWith(1);

      const thirdStep = screen.getByText('Style & Quality').closest('button');
      fireEvent.click(thirdStep);
      expect(handleClick).toHaveBeenCalledWith(2);
    });

    test('current step does not call onStepClick even if clickable', () => {
      const handleClick = vi.fn();
      render(<WizardProgress currentStep={2} onStepClick={handleClick} />);
      const currentStep = screen.getByText('Style & Quality').closest('button');
      fireEvent.click(currentStep);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('future steps do not call onStepClick', () => {
      const handleClick = vi.fn();
      render(<WizardProgress currentStep={1} onStepClick={handleClick} />);
      const futureStep = screen.getByText('Generating').closest('button');
      fireEvent.click(futureStep);
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('without onStepClick prop, completed steps not clickable', () => {
      render(<WizardProgress currentStep={2} />);
      const completedStep = screen.getByText('Tell Your Idea').closest('button');
      expect(completedStep).toBeDisabled();
    });

    test('completed steps have clickable class when onStepClick provided', () => {
      render(<WizardProgress currentStep={2} onStepClick={() => {}} />);
      const completedStep = screen.getByText('Tell Your Idea').closest('button');
      expect(completedStep).toHaveClass('clickable');
    });

    test('current and future steps not clickable even with onStepClick', () => {
      render(<WizardProgress currentStep={2} onStepClick={() => {}} />);
      const currentStep = screen.getByText('Style & Quality').closest('button');
      const futureStep = screen.getByText('Generating').closest('button');
      expect(currentStep).not.toHaveClass('clickable');
      expect(futureStep).not.toHaveClass('clickable');
    });
  });

  describe('Accessibility', () => {
    test('steps have button role', () => {
      render(<WizardProgress currentStep={0} />);
      const steps = screen.getAllByRole('button');
      expect(steps).toHaveLength(5);
    });

    test('steps have title attribute with full label', () => {
      render(<WizardProgress currentStep={0} />);
      const firstStep = screen.getByText('Tell Your Idea').closest('button');
      expect(firstStep).toHaveAttribute('title', 'Tell Your Idea');
    });

    test('completed steps are disabled', () => {
      render(<WizardProgress currentStep={2} />);
      const completedSteps = screen.getAllByRole('button').filter(btn =>
        btn.classList.contains('completed')
      );
      completedSteps.forEach(step => {
        expect(step).toBeDisabled();
      });
    });

    test('current and future steps are not disabled when not clickable', () => {
      render(<WizardProgress currentStep={1} />);
      const currentStep = screen.getByText('Your Content').closest('button');
      const futureStep = screen.getByText('Style & Quality').closest('button');
      expect(currentStep).toBeDisabled();
      expect(futureStep).toBeDisabled();
    });
  });

  describe('CSS Classes', () => {
    test('wizard-progress container exists', () => {
      render(<WizardProgress currentStep={0} />);
      expect(document.querySelector('.wizard-progress')).toBeInTheDocument();
    });

    test('each step has wizard-step class', () => {
      render(<WizardProgress currentStep={0} />);
      const steps = screen.getAllByRole('button');
      steps.forEach(step => {
        expect(step).toHaveClass('wizard-step');
      });
    });

    test('each step has wizard-step-circle', () => {
      render(<WizardProgress currentStep={0} />);
      const circles = document.querySelectorAll('.wizard-step-circle');
      expect(circles).toHaveLength(5);
    });

    test('each step has wizard-step-label', () => {
      render(<WizardProgress currentStep={0} />);
      const labels = document.querySelectorAll('.wizard-step-label');
      expect(labels).toHaveLength(5);
    });

    test('each step has wizard-step-short-label', () => {
      render(<WizardProgress currentStep={0} />);
      const shortLabels = document.querySelectorAll('.wizard-step-short-label');
      expect(shortLabels).toHaveLength(5);
    });

    test('connectors have wizard-connector class', () => {
      render(<WizardProgress currentStep={0} />);
      const connectors = document.querySelectorAll('.wizard-connector');
      expect(connectors.length).toBeGreaterThan(0);
      connectors.forEach(conn => {
        expect(conn).toHaveClass('wizard-connector');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles currentStep = -1 gracefully', () => {
      render(<WizardProgress currentStep={-1} />);
      // Should treat negative as 0
      const steps = screen.getAllByRole('button');
      expect(steps[0]).toHaveClass('active');
      expect(steps[0]).not.toHaveClass('completed');
    });

    test('handles currentStep = 5 (beyond max) gracefully', () => {
      render(<WizardProgress currentStep={5} />);
      const steps = screen.getAllByRole('button');
      // All 5 steps should be completed
      steps.forEach(step => {
        expect(step).toHaveClass('completed');
      });
    });

    test('renders without onStepClick prop', () => {
      render(<WizardProgress currentStep={1} />);
      // Should not throw
      expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    test('rapidly changing currentStep does not break', () => {
      const { rerender } = render(<WizardProgress currentStep={0} />);
      expect(screen.getByText('Tell Your Idea').closest('button')).toHaveClass('active');
      rerender(<WizardProgress currentStep={2} />);
      expect(screen.getByText('Style & Quality').closest('button')).toHaveClass('active');
      rerender(<WizardProgress currentStep={4} />);
      expect(screen.getByText('Your Video').closest('button')).toHaveClass('active');
    });
  });

  describe('Step Labels Content', () => {
    test('labels match STEPS array order', () => {
      render(<WizardProgress currentStep={0} />);
      const steps = screen.getAllByRole('button');
      expect(steps[0]).toHaveAttribute('title', 'Tell Your Idea');
      expect(steps[1]).toHaveAttribute('title', 'Your Content');
      expect(steps[2]).toHaveAttribute('title', 'Style & Quality');
      expect(steps[3]).toHaveAttribute('title', 'Generating');
      expect(steps[4]).toHaveAttribute('title', 'Your Video');
    });

    test('short labels display correctly', () => {
      render(<WizardProgress currentStep={0} />);
      const shortLabels = document.querySelectorAll('.wizard-step-short-label');
      expect(shortLabels[0]).toHaveTextContent('Idea');
      expect(shortLabels[1]).toHaveTextContent('Content');
      expect(shortLabels[2]).toHaveTextContent('Style');
      expect(shortLabels[3]).toHaveTextContent('Generate');
      expect(shortLabels[4]).toHaveTextContent('Result');
    });
  });
});
