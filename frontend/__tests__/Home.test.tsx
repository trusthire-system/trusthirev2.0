// @ts-nocheck
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page', () => {
    it('renders a heading', () => {
        render(<Home />);

        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        expect(heading).toHaveTextContent(/Hire Smarter/i);
    });

    it('contains call-to-action buttons', () => {
        render(<Home />);

        const browseButton = screen.getByText('Browse Open Jobs');
        const signupButton = screen.getByText('HR / Firm Sign Up');

        expect(browseButton).toBeInTheDocument();
        expect(signupButton).toBeInTheDocument();
    });
});
