import ActionButton from '../../bcgov/ActionButton';
import { buttonStyles } from '../../bcgov/ButtonStyles';
import { modalStyles } from './modalStyles';

/**
 * @interface
 * @description Properties passed to the DeletePrompt component.
 * @property {() => void} deleteHander - The action taken when delete is confirmed.
 * @property {string} title - The title of the modal popup.
 * @property {string} blurb - The text in the body of the modal. If multiple paragraphs are required, separate the paragraphs with ";;".
 * @property {string} id - The id assigned to this modal.
 */
interface DeletePromptProps {
  deleteHandler: () => void;
  title: string;
  blurb: string[];
  id: string;
}

/**
 * @description A modal element that can be used to confirm deletions.
 * @param {DeletePromptProps} props The properties passed to the component.
 * @returns A React component.
 */
const DeletePrompt = (props: DeletePromptProps) => {
  const { deleteHandler, title, blurb, id } = props;
  return (
    <dialog id={id} style={modalStyles.warningModalStyle}>
      <h4
        style={{
          marginBottom: '1em',
        }}
      >
        {title}
      </h4>
      {blurb.map((paragraph, index) => {
        const key = `blurb${title}${index}`;
        return (
          <p key={key} style={{ textAlign: 'start' }}>
            {paragraph}
          </p>
        );
      })}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2em',
        }}
      >
        <ActionButton
          style={buttonStyles.secondary}
          handler={() => {
            const thisDialog: HTMLDialogElement = document.querySelector(`#${id}`)!;
            thisDialog.close();
          }}
        >
          Cancel
        </ActionButton>
        <ActionButton style={buttonStyles.warning} handler={deleteHandler}>
          Confirm
        </ActionButton>
      </div>
    </dialog>
  );
};

export default DeletePrompt;
