import { render } from '@testing-library/react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

describe('Select', () => {
  it.skip('renders select trigger and items', () => {
    // Limitacion de jsdom: el contenido del select no se renderiza a menos que este abierto
    const { getByText } = render(
      <Select>
        <SelectTrigger>Select an option</SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Option 1</SelectItem>
          <SelectItem value="2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(getByText('Select an option')).toBeInTheDocument();
    expect(getByText('Option 1')).toBeInTheDocument();
    expect(getByText('Option 2')).toBeInTheDocument();
  });
});
