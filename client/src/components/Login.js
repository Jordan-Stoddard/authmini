import React from "react";
import axios from 'axios'

const url = process.env.REACT_APP_API_URL;

const initialUser = {
  username: "",
  password: ""
};

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        user: { ...initialUser },
        message: ""
    };
  }

inputHandler = ev => {
    const {name, value} = ev.target
    this.setState({user: {...this.state.user, [name]: value}})
}

submitHandler = ev => {
    ev.preventDefault()
    axios.post(`${url}/api/login`, this.state.user)
    .then(res => {
      console.log(res)
       if (res.status === 200 && res.data) {
         localStorage.setItem('secret_bitcoin_token', res.data)
           this.setState({
               message: 'Login successful',
               user: {...initialUser}
           })
       } else {
       throw new Error()
       }
    })
    .catch(err => {
        this.setState({
            message: 'Login failed',
            user: {...initialUser}
        })
    })
}


  render() {
    return (
      <div>
        <form onSubmit={this.submitHandler}>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={this.state.user.username}
            placeholder="username"
            onChange={this.inputHandler}
          />
          <label htmlFor="password">password</label>
          <input
            type="text"
            id="password"
            name="password"
            value={this.state.user.password}
            placeholder="password"
            onChange={this.inputHandler}
          />
          <button type="submit">Login</button>
        </form>
        {this.state.message
         ? ( <h4>{this.state.message}</h4>)
         : undefined
        }
       
      </div>
    );
  }
}
