import Icon from 'components/Icon';

interface Props {
  className?: string;
}

const Loader = ({ className = '', ...props }: Props) => {
  return (
      <span className="mb-3 me-2 text-dark border-dark border-3 ">
        <Icon name="spinner" className="rounded p-1" />
      </span>
  )
};

export default Loader;
