const { git } = require("lastejobb")

// Download "Natur i Norge" data kildedata - fylke og kommune
git.clone("https://github.com/Artsdatabanken/kommune.git", "temp/kommune")
