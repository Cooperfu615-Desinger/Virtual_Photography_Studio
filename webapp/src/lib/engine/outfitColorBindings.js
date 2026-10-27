// Reviewed outfit targets preserve the old parser's wording and ordered color roles.
// Absent bindings retain the legacy/custom-library path in the shared builder.
export function materializeOutfitColorBindings(base, bindings, {
  primaryColorText = '', contrastColorText = '', primaryMaterial = false,
} = {}) {
  if (!Array.isArray(bindings) || !bindings.length || !bindings.every(binding =>
    binding && ['primary', 'contrast'].includes(binding.channel)
      && typeof binding.target === 'string' && binding.target.trim()
      && typeof binding.omitForPrimaryMaterial === 'boolean')) return null;
  const parts = [base];
  let consumedPrimary = false;
  let consumedContrast = false;
  for (const binding of bindings) {
    if (primaryMaterial && binding.omitForPrimaryMaterial) continue;
    const color = binding.channel === 'primary' ? primaryColorText : contrastColorText;
    if (!color) continue;
    parts.push(`${binding.target} set to ${color}`);
    if (binding.channel === 'primary') consumedPrimary = true;
    else consumedContrast = true;
  }
  return { text: parts.join(', '), consumedPrimary, consumedContrast };
}
