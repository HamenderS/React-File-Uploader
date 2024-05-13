import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.css';
import 'react-toastify/dist/ReactToastify.css';

import UploadFile from './features/upload';

function App() {
  return (
      <>
      <div className="flex align-items-stretch vh-100 overflow-hidden">
        <div className="w-auto vh-100 overflow-hidden bg-black">
          <main className="flex-1 flex-grow-1 app-content h-auto overflow-auto bg-black">
            <div className="d-flex w-100 vh-100 justify-content-center ">
              <div className="w-75 h-100 overflow-hidden bg-gray">
                <UploadFile />
              </div>
            </div>
            <footer className="flex w-100 justify-content-center bg-gray px-10">

            </footer>
            <ToastContainer />
          </main>
        </div>
      </div>
      </>
  );
}

export default App;
