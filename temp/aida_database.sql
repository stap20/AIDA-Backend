--
-- PostgreSQL database dump
--

-- Dumped from database version 12.0
-- Dumped by pg_dump version 12.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


SET default_table_access_method = heap;

--
-- Name: child; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.child (
    child_id uuid NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    "Birth_Date" date NOT NULL,
    gender character varying NOT NULL,
    parent_id uuid NOT NULL,
    child_code character varying NOT NULL
);


--
-- Name: create_fmri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.create_fmri (
    child_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    fmri_id uuid NOT NULL
);


--
-- Name: create_questionaire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.create_questionaire (
    child_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    questionaire_id uuid NOT NULL
);


--
-- Name: create_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.create_schedule (
    parent_id uuid NOT NULL,
    schedule_id uuid NOT NULL
);


--
-- Name: create_video; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.create_video (
    child_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    video_id uuid NOT NULL
);


--
-- Name: diagnosis_process_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnosis_process_queue (
    queue_id uuid NOT NULL,
    in_time time without time zone NOT NULL,
    done_time time without time zone,
    state character varying NOT NULL
);


--
-- Name: fmri; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fmri (
    fmri_id uuid NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    fmri_url character varying NOT NULL,
    queue_id uuid NOT NULL
);


--
-- Name: parent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parent (
    parent_id uuid NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    "Birth_Date" date NOT NULL,
    country character varying,
    gender character varying NOT NULL,
    phone_number character varying
);


--
-- Name: questionaire; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questionaire (
    questionaire_id uuid NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    answers json NOT NULL,
    queue_id uuid NOT NULL,
    pdf_result_path character varying,
    result character varying
);


--
-- Name: sub_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_tasks (
    details character varying NOT NULL,
    state character varying NOT NULL,
    sub_task_id uuid NOT NULL,
    task_id uuid NOT NULL
);


--
-- Name: task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task (
    task_id uuid NOT NULL,
    "time" time without time zone NOT NULL,
    name character varying NOT NULL,
    state character varying NOT NULL,
    schedule_id uuid NOT NULL
);


--
-- Name: video; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video (
    video_id uuid NOT NULL,
    date date NOT NULL,
    "time" time without time zone NOT NULL,
    video_url character varying NOT NULL,
    queue_id uuid NOT NULL
);


--
-- Name: visual_schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.visual_schedule (
    schedule_id uuid NOT NULL,
    date date NOT NULL,
    state character varying NOT NULL,
    name character varying NOT NULL,
    child_id uuid NOT NULL
);


--
-- Name: child child_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child
    ADD CONSTRAINT child_code_unique UNIQUE (child_code);


--
-- Name: child child_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child
    ADD CONSTRAINT child_pkey PRIMARY KEY (child_id);


--
-- Name: create_fmri create_fmri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_fmri
    ADD CONSTRAINT create_fmri_pkey PRIMARY KEY (parent_id, fmri_id);


--
-- Name: create_questionaire create_questionaire_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_questionaire
    ADD CONSTRAINT create_questionaire_pkey PRIMARY KEY (parent_id, questionaire_id);


--
-- Name: create_schedule create_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_schedule
    ADD CONSTRAINT create_schedule_pkey PRIMARY KEY (parent_id, schedule_id);


--
-- Name: create_video create_video_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_video
    ADD CONSTRAINT create_video_pkey PRIMARY KEY (parent_id, video_id);


--
-- Name: diagnosis_process_queue diagnosis_process_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnosis_process_queue
    ADD CONSTRAINT diagnosis_process_queue_pkey PRIMARY KEY (queue_id);


--
-- Name: fmri fmri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fmri
    ADD CONSTRAINT fmri_pkey PRIMARY KEY (fmri_id);


--
-- Name: parent parent_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent
    ADD CONSTRAINT parent_email_key UNIQUE (email);


--
-- Name: parent parent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parent
    ADD CONSTRAINT parent_pkey PRIMARY KEY (parent_id);


--
-- Name: questionaire questionaire_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionaire
    ADD CONSTRAINT questionaire_pkey PRIMARY KEY (questionaire_id);


--
-- Name: sub_tasks sub_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_tasks
    ADD CONSTRAINT sub_tasks_pkey PRIMARY KEY (sub_task_id, task_id);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (task_id);


--
-- Name: video video_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video
    ADD CONSTRAINT video_pkey PRIMARY KEY (video_id);


--
-- Name: visual_schedule visual_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visual_schedule
    ADD CONSTRAINT visual_schedule_pkey PRIMARY KEY (schedule_id);


--
-- Name: child child_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.child
    ADD CONSTRAINT child_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent(parent_id);


--
-- Name: create_fmri create_fmri_fmri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_fmri
    ADD CONSTRAINT create_fmri_fmri_id_fkey FOREIGN KEY (fmri_id) REFERENCES public.fmri(fmri_id);


--
-- Name: create_fmri create_fmri_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_fmri
    ADD CONSTRAINT create_fmri_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent(parent_id);


--
-- Name: create_questionaire create_questionaire_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_questionaire
    ADD CONSTRAINT create_questionaire_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent(parent_id);


--
-- Name: create_questionaire create_questionaire_questionaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_questionaire
    ADD CONSTRAINT create_questionaire_questionaire_id_fkey FOREIGN KEY (questionaire_id) REFERENCES public.questionaire(questionaire_id);


--
-- Name: create_schedule create_schedule_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_schedule
    ADD CONSTRAINT create_schedule_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent(parent_id);


--
-- Name: create_schedule create_schedule_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_schedule
    ADD CONSTRAINT create_schedule_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.visual_schedule(schedule_id);


--
-- Name: create_video create_video_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_video
    ADD CONSTRAINT create_video_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parent(parent_id);


--
-- Name: create_video create_video_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.create_video
    ADD CONSTRAINT create_video_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.video(video_id);


--
-- Name: fmri fmri_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fmri
    ADD CONSTRAINT fmri_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.diagnosis_process_queue(queue_id);


--
-- Name: questionaire questionaire_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questionaire
    ADD CONSTRAINT questionaire_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.diagnosis_process_queue(queue_id);


--
-- Name: sub_tasks sub_tasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_tasks
    ADD CONSTRAINT sub_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.task(task_id);


--
-- Name: task task_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.visual_schedule(schedule_id);


--
-- Name: video video_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video
    ADD CONSTRAINT video_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.diagnosis_process_queue(queue_id);


--
-- Name: visual_schedule visual_schedule_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.visual_schedule
    ADD CONSTRAINT visual_schedule_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.child(child_id);


--
-- PostgreSQL database dump complete
--

