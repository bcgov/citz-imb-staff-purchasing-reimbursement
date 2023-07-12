import { modalStyles } from './modalStyles';
import ActionButton from '../../bcgov/ActionButton';
import { buttonStyles } from '../../bcgov/ButtonStyles';
import axios from 'axios';
import { CSSProperties, useContext, useState } from 'react';
import { ErrorContext, errorStyles } from '../notifications/ErrorWrapper';
import Constants from '../../../constants/Constants';
import { useAuthService } from '../../../keycloak';
import { FormControl, FormLabel, TextField } from '@mui/material';
import { normalFont } from '../../../constants/fonts';

/**
 * @description A component to handle users sending in reports.
 * @returns A React component.
 */
export const UserReport = () => {
  const { BACKEND_URL } = Constants;
  const [issueData, setIssueData] = useState({
    title: '',
    description: '',
  });
  const { state: authState } = useAuthService();
  const user = authState.userInfo;

  const maxDescCharacters = 300;
  const maxTitleCharacters = 100;
  const minCharacters = 10;
  const id = 'user-issue';

  // Error reporting
  const { setErrorState } = useContext(ErrorContext);

  /**
   * @description Sends an API request with the form data. Should create a JIRA issue with that info.
   */
  const sendReportToJIRA = async () => {
    try {
      const axiosReqConfig = {
        url: `${BACKEND_URL}/api/jira/create`,
        method: `post`,
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
        data: {
          title: issueData.title,
          description: `\
          ${issueData.description}\n\n \
          Submitted by ${user.given_name} ${user.family_name}\n \
          Email: ${user.email}\n \
          On ${new Date().toLocaleString()}`,
        },
      };
      const response = await axios(axiosReqConfig);

      if (response.status === 201) {
        // Success! Close popup and alert user.
        const thisDialog: HTMLDialogElement = document.querySelector(`#${id}`)!;
        thisDialog.close();
        setIssueData({ title: '', description: '' });
        setErrorState({
          text: 'Issue reported successfully.',
          open: true,
          style: errorStyles.success,
        });
      }
    } catch (e) {
      console.warn(e);
      // Request failed. Report error to user.
      setErrorState({
        text: 'Issue could not be submitted.',
        open: true,
        style: errorStyles.error,
      });
    }
  };

  // General styling for form elements.
  const formControlStyle: CSSProperties = {
    width: '100%',
    marginBottom: '1em',
    ...normalFont,
  };

  return (
    <dialog id={id} style={modalStyles.standardModalStyle}>
      <h4
        style={{
          marginBottom: '1em',
        }}
      >
        Submit Issue
      </h4>
      {/* Text box goes here. */}
      <form>
        <FormControl sx={formControlStyle}>
          <FormLabel htmlFor='issueTitle'>Issue Title</FormLabel>
          <TextField
            id='issueTitle'
            name='issueTitle'
            value={issueData.title}
            onChange={(e: any) => {
              if (e.target.value.length <= maxTitleCharacters) {
                setIssueData({ ...issueData, title: e.target.value });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            placeholder='e.g. Submit button not working'
            error={issueData.title.length < minCharacters && issueData.title.length !== 0}
            helperText={`Minimum of ${minCharacters} characters.`}
          />
        </FormControl>
        <FormControl sx={formControlStyle}>
          <FormLabel htmlFor='issueDescription'>Description</FormLabel>
          <TextField
            id='issueDescription'
            name='issueDescription'
            value={issueData.description}
            onChange={(e: any) => {
              if (e.target.value.length <= maxDescCharacters) {
                setIssueData({ ...issueData, description: e.target.value });
              }
            }}
            placeholder='Please mention the issue and any information leading up to that issue. Be descriptive.'
            multiline
            InputProps={{
              minRows: 4,
            }}
            error={
              issueData.description.length < minCharacters && issueData.description.length !== 0
            }
            helperText={`Minimum of ${minCharacters} characters.`}
          />
        </FormControl>
      </form>
      <p style={{ alignSelf: 'end' }}>{`${issueData.description.length}/${maxDescCharacters}`}</p>
      {/* Buttons go below. */}
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
            setIssueData({ title: '', description: '' });
            const thisDialog: HTMLDialogElement = document.querySelector(`#${id}`)!;
            thisDialog.close();
          }}
        >
          Cancel
        </ActionButton>
        <ActionButton
          style={buttonStyles.primary}
          handler={() => {
            sendReportToJIRA();
          }}
          disabled={
            issueData.title.length < minCharacters || issueData.description.length < minCharacters
          }
        >
          Submit
        </ActionButton>
      </div>
    </dialog>
  );
};
