export async function revealMaterialSymbols(
  targetDocument: Document = document,
  fonts: FontFaceSet | undefined = document.fonts,
) {
  if (!fonts) {
    targetDocument.documentElement.classList.add('material-symbols-ready')
    return
  }

  try {
    await fonts.load('400 24px "Material Symbols Outlined"')
    if (fonts.check('400 24px "Material Symbols Outlined"')) {
      targetDocument.documentElement.classList.add('material-symbols-ready')
    }
  } catch {
    // Keep ligature names hidden if the local font cannot be loaded.
  }
}
