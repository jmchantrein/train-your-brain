# Notices des composants tiers

Train Your Brain est publié sous licence GNU Affero General Public License, version 3 ou ultérieure (AGPL-3.0-or-later ; voir `LICENSE`). Ce fichier liste les
composants tiers redistribués, soit dans le fichier généré `index.html` (tout y est inclus), soit dans
ce dépôt, avec leur auteur, leur licence et le texte complet de celle-ci. Les mêmes mentions (liste et
texte de la licence MIT) sont écrites en tête de `index.html` par `scripts/build.js`, qui tient la
liste des composants (`THIRD_PARTY`) et vérifie que ce fichier les cite.

Les licences MIT et SIL OFL 1.1 sont compatibles avec la GNU AGPL version 3 ou ultérieure : ces composants gardent leur propre
licence, qui s'applique à eux seuls.

| Composant | Version | Auteur (copyright) | Licence | Où |
|-----------|---------|--------------------|---------|----|
| js-yaml | 4.3.2 | Vitaly Puzrin (2011-2015) | MIT | `index.html` (bibliothèque embarquée) |
| KaTeX | 0.16.47 | Khan Academy et contributeurs (2013-2020) | MIT | `index.html` (bibliothèque et feuille de style) |
| Polices KaTeX (20 fichiers woff2) | 0.16.47 | Design Science, Inc. (2009-2010) ; Khan Academy (2014-2018) | SIL OFL 1.1 | `index.html` (polices en base64 dans la feuille de style) |
| Police OpenDyslexic (2 fichiers woff2, latin, via @fontsource/opendyslexic) | 5.3.0 | Abbie Gonzalez (2012-2019) | SIL OFL 1.1 | `index.html` (polices en base64 dans la feuille de style, mode dyslexie) |
| LZ-String | version non consignée | pieroxy (2013) | MIT | `src/modules/compression.js` et `index.html` |

## js-yaml 4.3.2

- Source : https://github.com/nodeca/js-yaml
- Fichier embarqué : `node_modules/js-yaml/dist/js-yaml.min.js` (global `jsyaml`)
- Texte de licence, repris de `node_modules/js-yaml/LICENSE` :

```text
(The MIT License)

Copyright (C) 2011-2015 by Vitaly Puzrin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## KaTeX 0.16.47

- Source : https://github.com/KaTeX/KaTeX
- Fichiers embarqués : `node_modules/katex/dist/katex.min.js` et `katex.min.css`
- Texte de licence, repris de `node_modules/katex/LICENSE` :

```text
The MIT License (MIT)

Copyright (c) 2013-2020 Khan Academy and other contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Polices KaTeX (SIL Open Font License 1.1)

- Fichiers : les 20 polices `KaTeX_*.woff2` de `node_modules/katex/dist/fonts/`, encodées en base64
  dans la feuille de style de `index.html`.
- Copyright (c) 2009-2010, Design Science, Inc. (<www.mathjax.org>) ;
  Copyright (c) 2014-2018 Khan Academy (<www.khanacademy.org>), avec les noms de police réservés
  KaTeX_AMS, KaTeX_Caligraphic, KaTeX_Fraktur, KaTeX_Main, KaTeX_Math, KaTeX_SansSerif, KaTeX_Script,
  KaTeX_Size1, KaTeX_Size2, KaTeX_Size3, KaTeX_Size4 et KaTeX_Typewriter.
  (Mentions lues dans les champs « copyright » et « licence » des fichiers de police eux-mêmes.)
- Les polices sont redistribuées sans modification, avec le texte de licence ci-dessous (condition 2 de
  la licence). Elles ne sont pas vendues séparément.

```text
SIL OPEN FONT LICENSE

Version 1.1 - 26 February 2007

PREAMBLE

The goals of the Open Font License (OFL) are to stimulate worldwide development of collaborative font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.

The OFL allows the licensed fonts to be used, studied, modified and redistributed freely as long as they are not sold by themselves. The fonts, including any derivative works, can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works. The fonts and derivatives, however, cannot be released under any other type of license. The requirement for fonts to remain under this license does not apply to any document created using the fonts or their derivatives.

DEFINITIONS

"Font Software" refers to the set of files released by the Copyright Holder(s) under this license and clearly marked as such. This may include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the copyright statement(s).

"Original Version" refers to the collection of Font Software components as distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting, or substituting — in part or in whole — any of the components of the Original Version, by changing formats or by porting the Font Software to a new environment.

"Author" refers to any designer, engineer, programmer, technical writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS

Permission is hereby granted, free of charge, to any person obtaining a copy of the Font Software, to use, study, copy, merge, embed, modify, redistribute, and sell modified and unmodified copies of the Font Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components, in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled, redistributed and/or sold with any software, provided that each copy contains the above copyright notice and this license. These can be included either as stand-alone text files, human-readable headers or in the appropriate machine-readable metadata fields within text or binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font Name(s) unless explicit written permission is granted by the corresponding Copyright Holder. This restriction only applies to the primary font name as presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font Software shall not be used to promote, endorse or advertise any Modified Version, except to acknowledge the contribution(s) of the Copyright Holder(s) and the Author(s) or with their explicit written permission.

5) The Font Software, modified or unmodified, in part or in whole, must be distributed entirely under this license, and must not be distributed under any other license. The requirement for fonts to remain under this license does not apply to any document created using the Font Software.

TERMINATION

This license becomes null and void if any of the above conditions are not met.

DISCLAIMER

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE FONT SOFTWARE.
```

## OpenDyslexic 5.3.0 (SIL Open Font License 1.1)

- Source : https://github.com/fontsource/font-files/tree/main/fonts/google (paquet npm `@fontsource/opendyslexic` 5.3.0) ; police d'origine : https://opendyslexic.org
- Fichiers embarqués : `opendyslexic-latin-400-normal.woff2` et `opendyslexic-latin-700-normal.woff2` de `node_modules/@fontsource/opendyslexic/files/`, encodés en base64 dans la feuille de style de `index.html`. Ce sont les sous-ensembles « latin » préparés par Fontsource ; le build ne les modifie pas.
- Nom de police réservé : « OpenDyslexic ». Les polices ne sont pas vendues séparément.
- Texte de licence et copyright, repris de `node_modules/@fontsource/opendyslexic/LICENSE` :

```text
Copyright (c) 2019-07-29, Abbie Gonzalez (https://abbiecod.es|support@abbiecod.es),
with Reserved Font Name OpenDyslexic.
Copyright (c) 12/2012 - 2019
This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## LZ-String

- Source : https://github.com/pieroxy/lz-string
- Utilisation : `src/modules/compression.js` contient une copie adaptée de l'algorithme de compression
  (variante UTF-16), embarquée dans `index.html`.
- Licence : MIT. Le texte ci-dessous est celui du fichier `LICENSE` de lz-string 1.5.0 (paquet npm).
  La version dont la copie est issue n'est pas consignée ; les versions de lz-string antérieures à 1.5.0
  portaient la licence WTFPL (permissive), la licence MIT ci-dessous est donc la plus restrictive des deux.

```text
MIT License

Copyright (c) 2013 pieroxy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Documentation d'API du site publié (hors `index.html`)

Le site publié par `scripts/build-site.js` contient la documentation générée par JSDoc (4.0.5, Apache
License 2.0). Elle reprend les ressources du modèle par défaut de JSDoc : Google Code Prettify (Apache
License 2.0, Copyright (c) 2006 Google Inc.), la police Open Sans (Apache License 2.0, Copyright (c)
2010-2011 Google Inc.) et le thème « Tomorrow » pour Prettify (licence MIT, Copyright (c) 2016 Yoshihide Jimbo). Leurs mentions et le texte de l'Apache
License 2.0 sont dans `node_modules/jsdoc/LICENSE.md` (installé par `npm install`). Ces fichiers ne sont
ni dans `index.html` ni dans le dépôt.

## Non redistribués

Les dépendances de développement (terser, clean-css, jsdom, jsdoc, Playwright) servent à construire et
tester l'application ; leur code n'est ni copié dans le dépôt ni inclus dans `index.html`.
