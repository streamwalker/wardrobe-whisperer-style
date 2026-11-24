import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import WardrobePhoto from './WardrobePhoto';
afterEach(cleanup);
it('explains a broken photo and recovers when its URL is replaced', () => {
 const view=render(<WardrobePhoto src="https://old/photo.jpg" alt="My jacket" />);
 fireEvent.error(screen.getByRole('img', { name: 'My jacket' }));
 expect(screen.getByRole('img', { name: 'My jacket — photo unavailable' })).toBeInTheDocument();
 expect(screen.getByText('Your clothing details are saved.')).toBeInTheDocument();
 view.rerender(<WardrobePhoto src="https://new/photo.jpg" alt="My jacket" />);
 expect(screen.getByRole('img', { name: 'My jacket' })).toHaveAttribute('src','https://new/photo.jpg');
});
