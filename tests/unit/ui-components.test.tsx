import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/ui/price-tag';
import { StockBadge } from '@/components/ui/stock-badge';
import { Badge } from '@/components/ui/badge';
import { QuantityStepper } from '@/components/ui/quantity-stepper';
import { PhoneInput } from '@/components/ui/phone-input';
import { StatusPill } from '@/components/admin/status-pill';
import { DataTable } from '@/components/admin/data-table';

describe('PriceTag Component', () => {
  it('renders integer Naira correctly with currency symbol', () => {
    render(<PriceTag currentNgn={450000} />);
    // Intl format produces ₦450,000 (with possible non-breaking space)
    expect(screen.getByText(/450,000/)).toBeInTheDocument();
  });

  it('renders old price with strikethrough and discount percentage', () => {
    render(<PriceTag currentNgn={400000} oldNgn={500000} />);
    expect(screen.getByText(/400,000/)).toBeInTheDocument();
    expect(screen.getByText(/500,000/)).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
  });
});

describe('Button Component', () => {
  it('renders button with correct text and handles click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(btn);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button and shows spinner in loading state', () => {
    render(<Button isLoading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders WhatsApp variant with dark text for high contrast', () => {
    render(<Button variant="whatsapp">Order on WhatsApp</Button>);
    const btn = screen.getByRole('button', { name: /order on whatsapp/i });
    expect(btn.className).toContain('bg-brand-whatsapp');
  });
});

describe('StockBadge Component', () => {
  it('shows In Stock when quantity > 5 without leaking exact count', () => {
    render(<StockBadge quantity={15} />);
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.queryByText('15')).not.toBeInTheDocument();
  });

  it('shows Low Stock when quantity is between 1 and 5', () => {
    render(<StockBadge quantity={3} />);
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('shows Sold Out when quantity is 0', () => {
    render(<StockBadge quantity={0} />);
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });
});

describe('Badge Component', () => {
  it('renders correct labels for product badges', () => {
    render(<Badge variant="new" />);
    expect(screen.getByText('New')).toBeInTheDocument();

    render(<Badge variant="bestseller" />);
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
  });
});

describe('QuantityStepper Component', () => {
  it('increments and decrements within bounds', () => {
    const handleChange = vi.fn();
    render(<QuantityStepper value={2} min={1} max={5} onChange={handleChange} />);

    const incBtn = screen.getByRole('button', { name: /increase quantity/i });
    fireEvent.click(incBtn);
    expect(handleChange).toHaveBeenCalledWith(3);

    const decBtn = screen.getByRole('button', { name: /decrease quantity/i });
    fireEvent.click(decBtn);
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('disables decrement button when at minimum', () => {
    render(<QuantityStepper value={1} min={1} max={5} onChange={vi.fn()} />);
    const decBtn = screen.getByRole('button', { name: /decrease quantity/i });
    expect(decBtn).toBeDisabled();
  });
});

describe('PhoneInput Component', () => {
  it('renders +234 country code prefix and accessible label', () => {
    render(
      <PhoneInput
        id="phone"
        label="Customer WhatsApp"
        placeholder="8012345678"
      />
    );
    expect(screen.getByText('+234')).toBeInTheDocument();
    expect(screen.getByLabelText(/customer whatsapp/i)).toBeInTheDocument();
  });

  it('renders error message with role alert', () => {
    render(
      <PhoneInput
        id="phone"
        label="Phone"
        error="Invalid Nigerian phone number"
      />
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid Nigerian phone number');
  });
});

describe('StatusPill Component', () => {
  it('renders customer-friendly status labels', () => {
    render(<StatusPill status="confirmed" />);
    expect(screen.getByText('Confirmed, awaiting payment')).toBeInTheDocument();
  });
});

describe('DataTable Component', () => {
  interface Row {
    id: string;
    name: string;
  }

  const columns = [
    { key: 'name', header: 'Product Name' },
  ];

  it('renders empty message when no rows are provided', () => {
    render(
      <DataTable<Row>
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyMessage="No items found."
      />
    );
    expect(screen.getByText('No items found.')).toBeInTheDocument();
  });

  it('renders table rows properly', () => {
    render(
      <DataTable<Row>
        columns={columns}
        data={[{ id: '1', name: 'iPhone 15 Pro' }]}
        keyExtractor={(r) => r.id}
      />
    );
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });
});
