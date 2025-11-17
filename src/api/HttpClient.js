import AxiosInstance from './AxiosInstance';

export const HttpClient = {
  get:(url,config)=> AxiosInstance.get(url,config).then(res=>res.data),
  post:(url,data,config)=> AxiosInstance.post(url,data,config).then(res=>res.data),
  put:(url,data,config)=> AxiosInstance.put(url,data,config).then(res=>res.data),
  delete:(url,config)=> AxiosInstance.delete(url,config).then(res=>res.data),

}