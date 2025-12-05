# Component Tests

This directory contains unit tests for Svelte components using Vitest and @testing-library/svelte.

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:run

# Run tests with coverage
npm run coverage
```

## Test Files

### Footer.spec.js
Tests for the Footer component, focusing on:
- Export/Share menu functionality
- Share link generation and clipboard interaction
- Feedback states (idle, copied, shared, error)
- Project session management
- Export options (WAV, MIDI, JSON)

**Coverage**: 11 tests covering all major Footer interactions

### Transport.spec.js
Tests for the Transport component:
- Play/Stop toggle functionality
- Follow mode toggle
- Transport control event dispatching

**Coverage**: 1 test for basic transport controls

## Writing New Tests

Follow these patterns when adding new component tests:

```javascript
import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import YourComponent from '../YourComponent.svelte';

describe('YourComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(YourComponent, {
      props: {
        // your props here
      }
    });
    
    expect(getByText('Expected Text')).toBeTruthy();
  });
  
  it('should emit events on interaction', async () => {
    const { component, getByRole } = render(YourComponent);
    
    const handler = vi.fn();
    component.$on('eventname', handler);
    
    await fireEvent.click(getByRole('button', { name: 'Button Name' }));
    
    expect(handler).toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Use descriptive test names** - Test names should clearly describe what is being tested
2. **Test user interactions** - Focus on how users interact with components
3. **Test event dispatching** - Verify that components emit expected events
4. **Test conditional rendering** - Verify elements appear/disappear based on state
5. **Mock external dependencies** - Use `vi.fn()` to mock functions
6. **Clean up after tests** - Vitest handles cleanup automatically for most cases

## Testing Tools

- **Vitest**: Fast unit test framework
- **@testing-library/svelte**: Testing utilities for Svelte components
- **@testing-library/user-event**: Advanced user interaction simulation
- **jsdom**: Browser environment simulation

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
