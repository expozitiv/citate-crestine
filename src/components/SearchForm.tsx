import React from 'react'

/**
 * Câmpul de căutare: input serif italic + buton verde plin „caută”, lipite.
 * Formular GET către /cautare — funcționează fără JavaScript.
 */
export const SearchForm = ({
  compact = false,
  defaultValue = '',
  placeholder = 'Caută în 20.000+ de citate…',
}: {
  compact?: boolean
  defaultValue?: string
  placeholder?: string
}) => (
  <form
    action="/cautare"
    method="get"
    className={compact ? 'searchbox searchbox--compact' : 'searchbox'}
    role="search"
  >
    <input
      type="search"
      name="q"
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-label="Caută în citate"
    />
    <button type="submit">caută</button>
  </form>
)
