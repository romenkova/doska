import { Modal, ModalContent, ModalHeader } from "@doska/ui-kit"
import { ManageTagsList } from "./manage-tags-list"
import { useManageTags } from "./use-manage-tags"

export function ManageTagsModal() {
  const { boardId, close } = useManageTags()

  return (
    <Modal
      open={boardId !== null}
      onOpenChange={(next) => {
        if (!next) close()
      }}
    >
      <ModalContent className="md:max-w-md">
        <ModalHeader onClose={close}>Manage tags</ModalHeader>
        {boardId && <ManageTagsList boardId={boardId} />}
      </ModalContent>
    </Modal>
  )
}
