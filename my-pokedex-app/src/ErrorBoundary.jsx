import { useRouteError, Link } from 'react-router-dom';

const ErrorBoundary = () => {
    const error = useRouteError();
  
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
  
        <img 
          src="/src/assets/TeamRocketAnime.webp" 
          alt="Team Rocket" 
          className="mb-8 w-52" 
        />
  
        <div className="text-center">
          <div className="text-red-500 text-5xl">
            <span className="block text-gray-600">
              Looks like Team Rocket zapped us with a  
            </span>
            {error?.status ?? ''} 
          </div>
        </div>
  
        <p className="text-center text-lg text-gray-700 mb-8">
          {error?.statusText ?? 'Blasted off again!'}
        </p>
  
        <Link
          to="/"
          className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"  
        >
          Return to Home
        </Link>
  
      </div>
    );
  };
  
export default ErrorBoundary;