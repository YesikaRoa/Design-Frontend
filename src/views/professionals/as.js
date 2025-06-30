useEffect(() => {
  if (professional && specialties.length > 0 && subspecialties.length > 0) {
    // Mapear specialties desde nombres a {label, value}
    if (Array.isArray(professional.specialties)) {
      setSelectedSpecialties(
        professional.specialties.map((name) => {
          const found = specialties.find((s) => s.label === name)
          return found
            ? { label: found.label, value: found.value }
            : { label: name, value: `custom-${name}` } // Clave única
        }),
      )
    }

    if (Array.isArray(professional.subspecialties)) {
      setSelectedSubspecialties(
        professional.subspecialties.map((name) => {
          const found = subspecialties.find((s) => s.label === name)
          return found
            ? { label: found.label, value: found.value }
            : { label: name, value: `custom-${name}` } // Clave única
        }),
      )
    }
  }
}, [professional, specialties, subspecialties])
