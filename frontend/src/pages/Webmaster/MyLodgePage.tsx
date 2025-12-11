import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import LodgeForm from '../Management/LodgeForm';

const MyLodgePage = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona se não for webmaster ou não tiver loja
    if (user && user.user_type !== 'webmaster' && user.user_type !== 'super_admin') {
      navigate('/dashboard/lodge-dashboard');
    }
  }, [user, navigate]);

  // Se o usuário tem um lodge_id (que deve estar no token/contexto), 
  // precisamos de uma maneira de passar isso para o LodgeForm.
  // O LodgeForm espera um parâmetro de rota :id ou usa o id da URL.
  // Como estamos numa rota fixa 'minha-loja', precisamos que o LodgeForm saiba lidar com isso
    // OU redirecionamos para a rota de edição correta.
    
  // Abordagem Melhor: Redirecionar para a rota de edição se soubermos o ID.
  // Mas se o ID não estiver no user context, precisamos buscá-lo ou o LodgeForm precisa saber buscar "minha loja".
    
  // Vamos assumir que user.lodge_id existe (comum em JWT de webmaster).
  // Se não, o LodgeForm pode precisar de um modo "self".
  
  // Por enquanto, vamos tentar renderizar o LodgeForm forçando o ID se disponível, 
  // ou deixar o LodgeForm buscar se não passarmos nada (mas o LodgeForm atual depende de params.id).
  
  // WORKAROUND: Se tiver user.lodge_id, renderiza o LodgeForm hackeando o useParams 
  // (mas useParams vem do router).
  // O ideal é criar uma rota wrapper que faz o fetch do ID da loja do usuário e então renderiza o form.
    
    if (!user?.lodge_id) {
        return <div>Carregando ou usuário sem loja associada...</div>;
    }

    // Como LodgeForm usa useParams(), não podemos simplesmente renderizá-lo aqui sem o ID na URL
    // A MENOS que alteremos o LodgeForm para aceitar um id via props opcionais.
    // Vamos fazer isso: alterar LodgeForm para aceitar `id` via props.
    
    return <LodgeForm idProp={user.lodge_id.toString()} />;
};

export default MyLodgePage;
