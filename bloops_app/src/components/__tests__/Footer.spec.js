import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer.svelte';

describe('Footer component', () => {
  it('renders placeholder when there are no saved sessions', () => {
    const { getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null
      }
    });

    expect(getByText('No saved sessions')).toBeTruthy();
  });

  it('emits selectproject when a session is chosen', async () => {
    const selectProject = vi.fn();
    const { component, getByDisplayValue } = render(Footer, {
      props: {
        projects: [
          { id: 'a', name: 'First loop' },
          { id: 'b', name: 'Second loop' }
        ],
        currentId: 'a'
      }
    });

    component.$on('selectproject', selectProject);

    const select = getByDisplayValue('First loop');
    await fireEvent.change(select, { target: { value: 'b' } });

    expect(selectProject).toHaveBeenCalledWith(expect.objectContaining({ detail: { id: 'b' } }));
  });

  it('emits newproject when New is clicked', async () => {
    const newProject = vi.fn();
    const { component, getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null
      }
    });

    component.$on('newproject', newProject);
    await fireEvent.click(getByText('New'));

    expect(newProject).toHaveBeenCalled();
  });

  it('disables duplicate button when no session is selected', () => {
    const { getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null
      }
    });

    const duplicateButton = getByText('Duplicate');
    expect(duplicateButton.hasAttribute('disabled')).toBe(true);
  });
});
