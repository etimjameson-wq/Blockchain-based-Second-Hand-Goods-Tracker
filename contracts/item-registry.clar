;; ItemRegistry.clar
;; Sophisticated smart contract for registering and managing second-hand goods items
;; Handles item registration, metadata, categorization, status, collaborators, versions, and warranties
;; Serves as the foundational registry for a blockchain-based second-hand goods tracking system on Stacks

;; Constants
(define-constant ERR-ALREADY-REGISTERED u1)
(define-constant ERR-NOT-OWNER u2)
(define-constant ERR-INVALID-HASH u3)
(define-constant ERR-INVALID-INPUT u4)
(define-constant ERR-NOT-FOUND u5)
(define-constant ERR-MAX-LENGTH-EXCEEDED u6)
(define-constant ERR-UNAUTHORIZED u7)
(define-constant ERR-INVALID-WARRANTY u8)
(define-constant MAX-TITLE-LEN u100)
(define-constant MAX-DESC-LEN u500)
(define-constant MAX-CONDITION-LEN u200)
(define-constant MAX-CATEGORY-LEN u50)
(define-constant MAX-TAG-LEN u20)
(define-constant MAX-TAGS u10)
(define-constant MAX-NOTES-LEN u200)
(define-constant MAX-ROLE-LEN u50)
(define-constant MAX-PERMS u5)
(define-constant MAX-PERM-LEN u20)
(define-constant MAX-STATUS-LEN u20)
(define-constant MAX-WARRANTY-TERMS-LEN u200)

;; Data Maps
(define-map item-registry
  { item-hash: (buff 32) }  ;; Unique hash (e.g., SHA256 of serial + origin)
  {
    owner: principal,
    registration-timestamp: uint,
    origin-hash: (buff 32),  ;; Hash of origin documents
    serial-number: (string-utf8 50),
    title: (string-utf8 100),
    description: (string-utf8 500),
    initial-condition: (string-utf8 200)
  }
)

(define-map item-versions
  { item-hash: (buff 32), version: uint }
  {
    updated-hash: (buff 32),  ;; New hash after modification/repair
    update-notes: (string-utf8 200),
    timestamp: uint,
    updater: principal
  }
)

(define-map item-categories
  { item-hash: (buff 32) }
  {
    category: (string-utf8 50),
    tags: (list 10 (string-utf8 20))
  }
)

(define-map item-collaborators
  { item-hash: (buff 32), collaborator: principal }
  {
    role: (string-utf8 50),
    permissions: (list 5 (string-utf8 20)),
    added-at: uint,
    added-by: principal
  }
)

(define-map item-status
  { item-hash: (buff 32) }
  {
    status: (string-utf8 20),  ;; e.g., "available", "sold", "under-repair"
    visibility: bool,
    last-updated: uint,
    updater: principal
  }
)

(define-map item-warranties
  { item-hash: (buff 32), warranty-id: uint }
  {
    issuer: principal,
    expiry: uint,
    terms: (string-utf8 200),
    active: bool,
    issued-at: uint
  }
)

;; Private Functions
(define-private (is-valid-string (s (string-utf8 512)) (max-len uint))
  (and (> (len s) u0) (<= (len s) max-len))
)

(define-private (is-valid-hash (h (buff 32)))
  (is-eq (len h) u32)
)

(define-private (is-owner (item-hash (buff 32)) (caller principal))
  (let ((item (map-get? item-registry { item-hash: item-hash })))
    (and (is-some item) (is-eq (get owner (unwrap-panic item)) caller))
  )
)

;; Public Functions
(define-public (register-item
    (item-hash (buff 32))
    (origin-hash (buff 32))
    (serial-number (string-utf8 50))
    (title (string-utf8 100))
    (description (string-utf8 500))
    (initial-condition (string-utf8 200)))
  (let ((existing-item (map-get? item-registry { item-hash: item-hash })))
    (if (is-some existing-item)
      (err ERR-ALREADY-REGISTERED)
      (if (or
            (not (is-valid-hash item-hash))
            (not (is-valid-hash origin-hash))
            (not (is-valid-string serial-number u50))
            (not (is-valid-string title MAX-TITLE-LEN))
            (not (is-valid-string description MAX-DESC-LEN))
            (not (is-valid-string initial-condition MAX-CONDITION-LEN)))
        (err ERR-INVALID-INPUT)
        (begin
          (map-set item-registry
            { item-hash: item-hash }
            {
              owner: tx-sender,
              registration-timestamp: block-height,
              origin-hash: origin-hash,
              serial-number: serial-number,
              title: title,
              description: description,
              initial-condition: initial-condition
            }
          )
          (ok true)
        )
      )
    )
  )
)

(define-public (add-item-version
    (item-hash (buff 32))
    (version uint)
    (updated-hash (buff 32))
    (update-notes (string-utf8 200)))
  (let ((item (map-get? item-registry { item-hash: item-hash })))
    (if (not (is-some item))
      (err ERR-NOT-FOUND)
      (if (not (is-owner item-hash tx-sender))
        (err ERR-NOT-OWNER)
        (if (or
              (not (is-valid-hash updated-hash))
              (not (is-valid-string update-notes MAX-NOTES-LEN)))
          (err ERR-INVALID-INPUT)
          (begin
            (map-set item-versions
              { item-hash: item-hash, version: version }
              {
                updated-hash: updated-hash,
                update-notes: update-notes,
                timestamp: block-height,
                updater: tx-sender
              }
            )
            (ok true)
          )
        )
      )
    )
  )
)

(define-public (add-item-category
    (item-hash (buff 32))
    (category (string-utf8 50))
    (tags (list 10 (string-utf8 20))))
  (let ((item (map-get? item-registry { item-hash: item-hash })))
    (if (not (is-some item))
      (err ERR-NOT-FOUND)
      (if (not (is-owner item-hash tx-sender))
        (err ERR-NOT-OWNER)
        (if (or
              (not (is-valid-string category MAX-CATEGORY-LEN))
              (> (len tags) MAX-TAGS)
              (is-some (index-of tags "")))
          (err ERR-INVALID-INPUT)
          (begin
            (map-set item-categories
              { item-hash: item-hash }
              { category: category, tags: tags }
            )
            (ok true)
          )
        )
      )
    )
  )
)

(define-public (add-collaborator
    (item-hash (buff 32))
    (collaborator principal)
    (role (string-utf8 50))
    (permissions (list 5 (string-utf8 20))))
  (let ((item (map-get? item-registry { item-hash: item-hash })))
    (if (not (is-some item))
      (err ERR-NOT-FOUND)
      (if (not (is-owner item-hash tx-sender))
        (err ERR-NOT-OWNER)
        (if (or
              (not (is-valid-string role MAX-ROLE-LEN))
              (> (len permissions) MAX-PERMS)
              (is-some (index-of permissions "")))
          (err ERR-INVALID-INPUT)
          (begin
            (map-set item-collaborators
              { item-hash: item-hash, collaborator: collaborator }
              {
                role: role,
                permissions: permissions,
                added-at: block-height,
                added-by: tx-sender
              }
            )
            (ok true)
          )
        )
      )
    )
  )
)

(define-public (update-item-status
    (item-hash (buff 32))
    (status (string-utf8 20))
    (visibility bool))
  (let ((item (map-get? item-registry { item-hash: item-hash })))
    (if (not (is-some item))
      (err ERR-NOT-FOUND)
      (if (not (is-owner item-hash tx-sender))
        (err ERR-NOT-OWNER)
        (if (not (is-valid-string status MAX-STATUS-LEN))
          (err ERR-INVALID-INPUT)
          (begin
            (map-set item-status
              { item-hash: item-hash }
              {
                status: status,
                visibility: visibility,
                last-updated: block-height,
                updater: tx-sender
              }
            )
            (ok true)
          )
        )
      )
    )
  )
)

(define-public (register-warranty
    (item-hash (buff 32))
    (warranty-id uint)
    (expiry uint)
    (terms (string-utf8 200)))
  (let ((item (map-get? item-registry { item-hash: item-hash })))
    (if (not (is-some item))
      (err ERR-NOT-FOUND)
      (if (not (is-owner item-hash tx-sender))
        (err ERR-NOT-OWNER)
        (if (or
              (<= expiry block-height)
              (not (is-valid-string terms MAX-WARRANTY-TERMS-LEN)))
          (err ERR-INVALID-WARRANTY)
          (begin
            (map-set item-warranties
              { item-hash: item-hash, warranty-id: warranty-id }
              {
                issuer: tx-sender,
                expiry: expiry,
                terms: terms,
                active: true,
                issued-at: block-height
              }
            )
            (ok true)
          )
        )
      )
    )
  )
)

;; Read-Only Functions
(define-read-only (get-item-details (item-hash (buff 32)))
  (map-get? item-registry { item-hash: item-hash })
)

(define-read-only (verify-item-ownership (item-hash (buff 32)) (owner principal))
  (let ((item (map-get? item-registry { item-hash: item-hash })))
    (if (and
          (is-some item)
          (is-eq (get owner (unwrap-panic item)) owner))
      (ok true)
      (err ERR-NOT-OWNER)
    )
  )
)

(define-read-only (get-item-version (item-hash (buff 32)) (version uint))
  (map-get? item-versions { item-hash: item-hash, version: version })
)

(define-read-only (get-item-category (item-hash (buff 32)))
  (map-get? item-categories { item-hash: item-hash })
)

(define-read-only (get-collaborator-details (item-hash (buff 32)) (collaborator principal))
  (map-get? item-collaborators { item-hash: item-hash, collaborator: collaborator })
)

(define-read-only (get-item-status (item-hash (buff 32)))
  (map-get? item-status { item-hash: item-hash })
)

(define-read-only (get-warranty-details (item-hash (buff 32)) (warranty-id uint))
  (map-get? item-warranties { item-hash: item-hash, warranty-id: warranty-id })
)