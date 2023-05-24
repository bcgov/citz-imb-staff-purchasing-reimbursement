import { Paper } from "@mui/material";
import { headerFont, normalFont } from "../constants/fonts";
import LinkButton from "../components/bcgov/LinkButton";
import { buttonStyles } from "../components/bcgov/ButtonStyles";
import Constants from "../constants/Constants";

const Login = () => {
  const { BACKEND_URL } = Constants;

  return (
    <Paper elevation={3} sx={{
      padding: '1em',
      width: 'fit-content',
      margin: '10% auto',
      textAlign: 'center',
      ...normalFont
    }}>
      <h3 style={{...headerFont}}>Login Required</h3>
      <p style={{
        margin: '2em'
      }}>To access this application, log in with your IDIR.</p>
      <LinkButton link={`${BACKEND_URL}/oauth/login`} style={buttonStyles.primary}>Log In</LinkButton>
    </Paper>
  );
}

export default Login;
