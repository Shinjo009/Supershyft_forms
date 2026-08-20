import { createPortal } from 'react-dom'
import infoIcon from '../../assets/family-history/info-icon.svg'

export function AnthropometryInfoButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className="ndq-anthro__info-btn" aria-label={label} onClick={onClick}>
      <img src={infoIcon} alt="" className="size-full" aria-hidden />
    </button>
  )
}

export function AnthropometryInfoPopup({
  open,
  label,
  gifSrc,
  onClose,
}: {
  open: boolean
  label: string
  gifSrc: string
  onClose: () => void
}) {
  if (!open) return null

  return createPortal(
    <div className="ndq-anthro__info-overlay" onClick={onClose} aria-hidden="true">
      <div className="ndq-anthro__info-column" onClick={onClose}>
        <div
          className="ndq-anthro__info-popup"
          role="dialog"
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="ndq-anthro__info-handle" aria-hidden="true" />
          <button type="button" className="ndq-anthro__info-close" onClick={onClose} aria-label={`Close ${label}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M12 4L4 12M4 4L12 12" stroke="#9A9A9A" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="ndq-anthro__info-gif" style={{ backgroundImage: `url(${gifSrc})` }} aria-label={`${label} guide`} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
