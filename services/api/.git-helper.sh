#!/bin/bash
# Helper script para hacer commit desde services/api incluyendo archivos del directorio padre

# Agregar cambios del directorio actual
git add .

# Agregar archivos del directorio padre si existen
if [ -f "../../render.yaml" ]; then
  git add ../../render.yaml
fi

if [ -f "../../RENDER_CONFIG.md" ]; then
  git add ../../RENDER_CONFIG.md
fi

# Mostrar estado
git status

# Preguntar mensaje de commit
read -p "Mensaje de commit: " commit_message

# Hacer commit
git commit -m "$commit_message"

# Push
git push

