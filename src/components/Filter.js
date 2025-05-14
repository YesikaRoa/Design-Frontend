import React from 'react'
import '../views/users/styles/filter.css'
import { CFormInput, CFormSelect } from '@coreui/react'
import '@coreui/coreui/dist/css/coreui.min.css' // Importa el CSS base de CoreUI

const UserFilter = ({ onFilter, resetFilters, dataFilter }) => {
  return (
    <div className="filter-container">
      {dataFilter.map((filter) =>
        filter.type === 'select' ? (
          <CFormSelect
            key={filter.name}
            floatingLabel={filter.label}
            value={filter.value}
            onChange={filter.onChange}
            className="filter-input"
          >
            <option value=""></option> {/* Opción vacía sin texto */}
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </CFormSelect>
        ) : (
          <CFormInput
            key={filter.name}
            type={filter.type}
            floatingLabel={filter.label}
            placeholder={filter.placeholder}
            value={filter.value}
            onChange={filter.onChange}
            className="filter-input"
          />
        ),
      )}

      <div className="filter-buttons">
        <button onClick={onFilter} className="btn btn-primary search-button">
          Search
        </button>
        <button className="reset-button" onClick={resetFilters}>
          Reset
        </button>
      </div>
    </div>
  )
}

export default UserFilter
