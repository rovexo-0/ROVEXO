"use client";

import { useState } from "react";
import type { UserAddress } from "@/lib/addresses/repository";

type EditAddressProps = {
  address: UserAddress;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onCancel: () => void;
};

/**
 * Edit Address sheet → Delete Address → Confirmation → Delete.
 */
export function EditAddress({
  address,
  onEdit,
  onSetDefault,
  onDelete,
  onCancel,
}: EditAddressProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (confirmDelete) {
    return (
      <div
        className="addresses-v1-edit-backdrop"
        role="presentation"
        onClick={onCancel}
        data-addresses-edit="confirm-delete"
      >
        <div
          className="addresses-v1-edit-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="addresses-delete-confirm-title"
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id="addresses-delete-confirm-title" className="addresses-v1-edit-sheet__title">
            Delete Address
          </h2>
          <p className="addresses-v1-edit-sheet__copy">
            This address will be permanently removed. This cannot be undone.
          </p>
          <button
            type="button"
            className="addresses-v1-edit-sheet__row addresses-v1-edit-sheet__row--danger"
            onClick={onDelete}
          >
            Delete
          </button>
          <button
            type="button"
            className="addresses-v1-edit-sheet__cancel"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="addresses-v1-edit-backdrop"
      role="presentation"
      onClick={onCancel}
      data-addresses-edit="sheet"
    >
      <div
        className="addresses-v1-edit-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="addresses-edit-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="addresses-edit-sheet-title" className="addresses-v1-edit-sheet__title">
          Edit Address
        </h2>
        <button type="button" className="addresses-v1-edit-sheet__row" onClick={onEdit}>
          Edit Address
        </button>
        <button
          type="button"
          className="addresses-v1-edit-sheet__row"
          onClick={onSetDefault}
          disabled={address.isDefault}
        >
          Set as Default
        </button>
        <button
          type="button"
          className="addresses-v1-edit-sheet__row addresses-v1-edit-sheet__row--danger"
          onClick={() => setConfirmDelete(true)}
        >
          Delete Address
        </button>
        <button type="button" className="addresses-v1-edit-sheet__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
